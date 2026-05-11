"""Run intelligent matching on Inspiring Girls program and create vinculations."""
import json
import psycopg2

DSN = 'postgresql://inspiratoria:ZyZHBLebIvbbRgadxGvBTLSGcbprL5AI@dpg-d4nmf9ogjchc73bu30t0-a.oregon-postgres.render.com:5432/inspiratoria'
PID = '02d527b4-16d4-4ce7-9c69-622fdb672183'

conn = psycopg2.connect(DSN)
cur = conn.cursor()

# 1) Load all participants with full profile
cur.execute(
    """SELECT pp.id, pp.role, u.id, u.email, u.first_name||' '||u.last_name AS name,
              COALESCE(u.skills, '[]'::jsonb),
              COALESCE(u.mentor_topics, '[]'::jsonb),
              COALESCE(u.mentor_objectives, '[]'::jsonb),
              COALESCE(u.mentor_style, '[]'::jsonb),
              COALESCE(u.mentee_goals, '[]'::jsonb),
              COALESCE(u.mentee_challenges, '[]'::jsonb),
              COALESCE(u.mentee_interests, '[]'::jsonb),
              COALESCE(u.preferred_mentor_style, '[]'::jsonb),
              COALESCE(u.experience_area, '[]'::jsonb),
              u.experience_level
       FROM programs_programparticipant pp
       JOIN companies_user u ON u.id = pp.user_id
       WHERE pp.program_id = %s AND pp.deleted_at IS NULL""",
    (PID,),
)
rows = cur.fetchall()


def lower_set(items):
    return {str(x).strip().lower() for x in items if x}


mentors, mentees = [], []
for r in rows:
    pp_id, prog_role, uid, email, name, skills, m_top, m_obj, m_style, me_goals, me_chal, me_int, pref_style, exp_area, exp_level = r
    bucket = {
        'pp_id': pp_id,
        'uid': uid,
        'email': email,
        'name': name,
        'skills': lower_set(skills),
        'topics': lower_set(m_top),
        'objectives': lower_set(m_obj),
        'style': lower_set(m_style),
        'goals': lower_set(me_goals),
        'challenges': lower_set(me_chal),
        'interests': lower_set(me_int),
        'pref_style': lower_set(pref_style),
        'area': lower_set(exp_area),
        'level': (exp_level or '').strip().lower(),
    }
    if prog_role == 'mentor':
        mentors.append(bucket)
    elif prog_role == 'mentee':
        mentees.append(bucket)


def jaccard(a, b):
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def score_pair(m, e):
    # 6 dimensiones del motor (ponderaciones del PROJECT_OVERVIEW)
    skills_goals = jaccard(m['skills'] | m['topics'], e['goals'] | e['interests']) * 25
    topics_chal = jaccard(m['topics'], e['challenges'] | e['interests']) * 20
    style_fit = jaccard(m['style'], e['pref_style']) * 15
    exp_fit = 15.0 if m['level'] and m['level'] != e['level'] else 7.5  # senior > junior es bueno
    obj_fit = jaccard(m['objectives'], e['goals'] | e['challenges']) * 15
    domain_fit = jaccard(m['area'], e['area'] | e['interests']) * 10
    total = skills_goals + topics_chal + style_fit + exp_fit + obj_fit + domain_fit
    return {
        'total': round(total, 1),
        'skills_goals': round(skills_goals, 1),
        'topics_challenges': round(topics_chal, 1),
        'style_fit': round(style_fit, 1),
        'experience_fit': round(exp_fit, 1),
        'objectives_fit': round(obj_fit, 1),
        'domain_fit': round(domain_fit, 1),
        'matched_keywords': sorted((m['topics'] | m['objectives']) & (e['goals'] | e['interests'] | e['challenges']))[:8],
    }


# 2) Compute all pairs
print("=== RANKING DE PARES (6 mentoras x 2 mentees = 12 pares) ===\n")
all_pairs = []
for me in mentees:
    print(f"\n>>> Mentee: {me['name']} ({me['email']})")
    pairs = []
    for m in mentors:
        s = score_pair(m, me)
        pairs.append((s['total'], m, me, s))
    pairs.sort(key=lambda x: -x[0])
    for total, m, e, s in pairs:
        kws = ', '.join(s['matched_keywords']) if s['matched_keywords'] else '-'
        print(f"   {total:5.1f}  {m['name']:35} | sk/g={s['skills_goals']:4} top/ch={s['topics_challenges']:4} sty={s['style_fit']:4} exp={s['experience_fit']:4} obj={s['objectives_fit']:4} dom={s['domain_fit']:4}  | kw: {kws}")
    all_pairs.extend(pairs)

# 3) Greedy assignment: each mentee gets best available mentor (no mentor reused for >1 mentee since pool is small)
all_pairs.sort(key=lambda x: -x[0])
assigned_mentors, assigned_mentees, picks = set(), set(), []
for total, m, e, s in all_pairs:
    if m['uid'] in assigned_mentors or e['uid'] in assigned_mentees:
        continue
    picks.append((total, m, e, s))
    assigned_mentors.add(m['uid'])
    assigned_mentees.add(e['uid'])
    if len(assigned_mentees) == len(mentees):
        break

print("\n\n=== ASIGNACIONES FINALES ===")
for total, m, e, s in picks:
    print(f"  [{total:5.1f}]  {m['name']}  <->  {e['name']}")

# 4) Create vinculations
print("\n=== CREANDO VINCULACIONES ===")
for total, m, e, s in picks:
    cur.execute(
        """SELECT id FROM programs_vinculation
           WHERE program_id=%s AND
                 ((participant1_id=%s AND participant2_id=%s)
                  OR (participant1_id=%s AND participant2_id=%s))
             AND status='active'""",
        (PID, m['pp_id'], e['pp_id'], e['pp_id'], m['pp_id']),
    )
    existing = cur.fetchone()
    if existing:
        print(f"  ya existe vinculación id={existing[0]} para {m['name']} <-> {e['name']}")
        continue
    metadata = {
        'created_via': 'intelligent_match_v1',
        'score_total': s['total'],
        'breakdown': {
            'skills_goals': s['skills_goals'],
            'topics_challenges': s['topics_challenges'],
            'style_fit': s['style_fit'],
            'experience_fit': s['experience_fit'],
            'objectives_fit': s['objectives_fit'],
            'domain_fit': s['domain_fit'],
        },
        'matched_keywords': s['matched_keywords'],
    }
    cur.execute(
        """INSERT INTO programs_vinculation
           (type, status, metadata, created_at, participant1_id, participant2_id, program_id)
           VALUES ('mentoria', 'active', %s::jsonb, NOW(), %s, %s, %s) RETURNING id""",
        (json.dumps(metadata), m['pp_id'], e['pp_id'], PID),
    )
    new_id = cur.fetchone()[0]
    print(f"  creada id={new_id}: {m['name']} <-> {e['name']}  score={s['total']}")

conn.commit()

# 5) Verify
print("\n=== VINCULACIONES ACTIVAS DEL PROGRAMA ===")
cur.execute(
    """SELECT v.id, v.type, v.status,
              p1.role, u1.email AS u1_email, u1.first_name||' '||u1.last_name AS u1_name,
              p2.role, u2.email AS u2_email, u2.first_name||' '||u2.last_name AS u2_name,
              v.metadata->>'score_total' AS score
       FROM programs_vinculation v
       JOIN programs_programparticipant p1 ON p1.id = v.participant1_id
       JOIN programs_programparticipant p2 ON p2.id = v.participant2_id
       JOIN companies_user u1 ON u1.id = p1.user_id
       JOIN companies_user u2 ON u2.id = p2.user_id
       WHERE v.program_id = %s AND v.status='active'
       ORDER BY v.created_at""",
    (PID,),
)
for r in cur.fetchall():
    print(r)

conn.close()
print("\nDONE.")
