"""Set up Inspiring Girls program: reclassify mentors, fix names, fill profiles, activate."""
import json
import psycopg2

DSN = 'postgresql://inspiratoria:ZyZHBLebIvbbRgadxGvBTLSGcbprL5AI@dpg-d4nmf9ogjchc73bu30t0-a.oregon-postgres.render.com:5432/inspiratoria'
PID = '02d527b4-16d4-4ce7-9c69-622fdb672183'

conn = psycopg2.connect(DSN)
cur = conn.cursor()

cur.execute(
    "UPDATE programs_programparticipant SET role='mentor', updated_at=NOW() "
    "WHERE program_id=%s AND role='participant_cell'",
    (PID,),
)
print(f"Reclasificadas a mentor en programa: {cur.rowcount}")

cur.execute(
    """UPDATE companies_user SET role='mentor', updated_at=NOW()
       WHERE id IN (SELECT user_id FROM programs_programparticipant WHERE program_id=%s)
         AND role='participant'""",
    (PID,),
)
print(f"Rol global cambiado a mentor: {cur.rowcount}")

cur.execute(
    """UPDATE companies_user
       SET first_name='Macarena', last_name='Salosny Lagos',
           full_name='Macarena Salosny Lagos', updated_at=NOW()
       WHERE email='maca.salosnylagos@gmail.com'"""
)
print(f"Nombre Maca corregido: {cur.rowcount}")
conn.commit()

mentors = {
    'alejandracarvajal.berenguela@gmail.com': dict(
        bio='Profesional con trayectoria en liderazgo y desarrollo organizacional. Comprometida con inspirar a niñas y jóvenes a creer en su potencial.',
        headline='Conferencista | Liderazgo y desarrollo de talento',
        skills=['Liderazgo', 'Comunicación', 'Coaching', 'Mentoría', 'Desarrollo organizacional'],
        experience_area=['Recursos Humanos', 'Educación', 'Consultoría'],
        experience_level='11 a 15 años',
        mentor_style=['Cercano y contenedor', 'Inspirador y motivador', 'Reflexivo, basado en preguntas'],
        mentor_topics=['Liderazgo femenino', 'Empoderamiento personal', 'Carrera profesional', 'Mentoría y propósito'],
        mentor_objectives=['Inspirar vocaciones', 'Fortalecer autoconfianza', 'Acompañar transiciones de carrera', 'Compartir experiencias de liderazgo'],
        gender='Femenino', position='Conferencista Inspiring Girls',
    ),
    'catherinemolina@latamlogistics.cl': dict(
        bio='Líder en logística y operaciones con foco en innovación y diversidad. Embajadora de mujeres en industrias tradicionalmente masculinas.',
        headline='Líder en logística | Mujeres en STEM y operaciones',
        skills=['Operaciones', 'Logística', 'Liderazgo', 'Gestión de equipos', 'Estrategia'],
        experience_area=['Operaciones', 'Logística', 'Comercial / Ventas'],
        experience_level='11 a 15 años',
        mentor_style=['Estratégico y orientado a objetivos', 'Práctico y enfocado en la acción', 'Directo y desafiante'],
        mentor_topics=['Liderazgo femenino', 'Carrera profesional', 'Manejo de equipos', 'Negociación y autoconfianza'],
        mentor_objectives=['Visibilizar mujeres en operaciones', 'Mentoría en industrias masculinas', 'Romper sesgos', 'Inspirar vocaciones STEM'],
        gender='Femenino', position='Conferencista Inspiring Girls | Logística',
    ),
    'fcabarrientos@gmail.com': dict(
        bio='Profesional con foco en estrategia comercial y desarrollo de personas. Cree en el poder de la mentoría como motor de cambio.',
        headline='Conferencista | Estrategia comercial y mentoría',
        skills=['Estrategia comercial', 'Marketing', 'Liderazgo', 'Comunicación', 'Negociación'],
        experience_area=['Comercial / Ventas', 'Marketing', 'Consultoría'],
        experience_level='11 a 15 años',
        mentor_style=['Cercano y contenedor', 'Inspirador y motivador', 'Estratégico y orientado a objetivos'],
        mentor_topics=['Liderazgo femenino', 'Carrera profesional', 'Marca personal', 'Comunicación efectiva'],
        mentor_objectives=['Inspirar vocaciones', 'Acompañar a jóvenes en sus primeras decisiones', 'Compartir herramientas prácticas', 'Visibilizar referentes femeninas'],
        gender='Femenino', position='Conferencista Inspiring Girls',
    ),
    'maca.salosnylagos@gmail.com': dict(
        bio='Fundadora y directora de Inspiratoria. Apasionada por crear espacios de mentoría que transformen la vida de mujeres y niñas.',
        headline='Directora Inspiratoria | Mentoría y empoderamiento femenino',
        skills=['Liderazgo', 'Estrategia', 'Mentoría', 'Comunicación', 'Gestión de proyectos', 'Innovación social'],
        experience_area=['Comercial / Ventas', 'Marketing', 'Proyectos / Innovación'],
        experience_level='11 a 15 años',
        mentor_style=['Estratégico y orientado a objetivos', 'Directo y desafiante', 'Inspirador y motivador'],
        mentor_topics=['Liderazgo femenino', 'Mentoría y propósito', 'Empoderamiento personal'],
        mentor_objectives=['Multiplicar referentes femeninas', 'Acompañar líderes emergentes', 'Inspirar transformación social'],
        gender='Femenino', position='Directora Ejecutiva | Inspiratoria',
    ),
    'msabando@gmail.com': dict(
        bio='Profesional senior con amplia experiencia en operaciones, finanzas y proyectos de innovación. Mentora desde la convicción de que las mujeres pueden liderar cualquier área.',
        headline='Conferencista | Operaciones, finanzas e innovación',
        skills=['Operaciones', 'Finanzas', 'Gestión de proyectos', 'Liderazgo', 'Tecnología', 'Estrategia'],
        experience_area=['Operaciones', 'Finanzas', 'Tecnología', 'Proyectos / Innovación'],
        experience_level='11 a 15 años',
        mentor_style=['Cercano y contenedor', 'Práctico y enfocado en la acción', 'Estratégico y orientado a objetivos', 'Reflexivo, basado en preguntas', 'Inspirador y motivador'],
        mentor_topics=['Liderazgo femenino', 'Carrera profesional', 'Equilibrio vida-trabajo', 'Manejo de equipos', 'Mentoría y propósito'],
        mentor_objectives=['Inspirar vocaciones', 'Romper sesgos en STEM', 'Acompañar transiciones', 'Compartir aprendizajes prácticos'],
        gender='Femenino', position='Conferencista Inspiring Girls',
    ),
    'veronicavial@gmail.com': dict(
        bio='Líder con vocación social y trayectoria en proyectos educativos. Comprometida con abrir caminos para que más niñas se atrevan a soñar en grande.',
        headline='Conferencista | Educación y propósito',
        skills=['Educación', 'Liderazgo', 'Comunicación', 'Coaching', 'Proyectos sociales'],
        experience_area=['Educación', 'Proyectos / Innovación', 'Recursos Humanos'],
        experience_level='11 a 15 años',
        mentor_style=['Cercano y contenedor', 'Inspirador y motivador', 'Reflexivo, basado en preguntas'],
        mentor_topics=['Liderazgo femenino', 'Empoderamiento personal', 'Mentoría y propósito', 'Comunicación efectiva'],
        mentor_objectives=['Inspirar vocaciones', 'Visibilizar referentes femeninas', 'Acompañar primeras decisiones de carrera'],
        gender='Femenino', position='Conferencista Inspiring Girls',
    ),
}

mentees = {
    'peterfulle@icloud.com': dict(
        bio='Joven con interés en tecnología y emprendimiento, buscando referentes y aprendizajes prácticos.',
        headline='Mentee Inspiring Girls',
        skills=['Curiosidad', 'Comunicación', 'Trabajo en equipo'],
        experience_area=['Tecnología'],
        experience_level='Menos de 2 años',
        mentee_goals=['Explorar opciones de carrera', 'Desarrollar autoconfianza', 'Crear red de contactos', 'Aprender de referentes femeninas'],
        mentee_challenges=['Definir vocación', 'Sentirse segura para hablar en público', 'Equilibrar estudios y proyectos personales'],
        mentee_interests=['Liderazgo femenino', 'Carrera profesional', 'Empoderamiento personal', 'Marca personal'],
        mentee_outcomes=['Tomar decisiones más informadas', 'Tener una mentora referente', 'Sentirse más segura'],
        mentee_expectations=['Conversaciones honestas', 'Aprender de experiencias reales', 'Recibir feedback constructivo'],
        preferred_mentor_style=['Cercano y contenedor', 'Inspirador y motivador'],
        session_format_preference=['Online', 'Mixto'],
        gender='Femenino', position='Mentee',
    ),
    'smakovskaya@gmail.com': dict(
        bio='Joven mentee con interés en desarrollo profesional, liderazgo y crecimiento personal.',
        headline='Mentee Inspiring Girls',
        skills=['Comunicación', 'Aprendizaje continuo', 'Pensamiento crítico'],
        experience_area=['Marketing', 'Comercial / Ventas'],
        experience_level='Menos de 2 años',
        mentee_goals=['Desarrollar liderazgo', 'Crear red profesional', 'Definir próximos pasos de carrera', 'Aumentar autoconfianza'],
        mentee_challenges=['Hablar en público', 'Tomar decisiones difíciles', 'Manejar la incertidumbre'],
        mentee_interests=['Liderazgo femenino', 'Comunicación efectiva', 'Networking estratégico', 'Empoderamiento personal'],
        mentee_outcomes=['Tener claridad sobre próximos pasos', 'Sentirse más segura', 'Construir un plan de crecimiento'],
        mentee_expectations=['Espacio de confianza', 'Feedback honesto', 'Inspiración real'],
        preferred_mentor_style=['Inspirador y motivador', 'Reflexivo, basado en preguntas'],
        session_format_preference=['Online'],
        gender='Femenino', position='Mentee',
    ),
}


def apply(email, p, is_mentor):
    fields, vals = [], []
    for k, v in p.items():
        fields.append(f"{k}=%s")
        vals.append(json.dumps(v) if isinstance(v, list) else v)
    fields.append("mentor_profile_step=4" if is_mentor else "mentee_profile_step=4")
    fields.append("is_account_activated=TRUE")
    fields.append("is_onboarded=TRUE")
    fields.append("updated_at=NOW()")
    cur.execute(f"UPDATE companies_user SET {', '.join(fields)} WHERE email=%s", vals + [email])
    return cur.rowcount


print("\n=== MENTORES ===")
for email, p in mentors.items():
    print(f"  [{apply(email, p, True)}] {email}")

print("\n=== MENTEES ===")
for email, p in mentees.items():
    print(f"  [{apply(email, p, False)}] {email}")

conn.commit()

print("\n=== ESTADO FINAL ===")
cur.execute(
    """SELECT pp.role, u.email, u.first_name||' '||u.last_name AS name,
              u.is_account_activated, u.mentor_profile_step, u.mentee_profile_step,
              jsonb_array_length(COALESCE(u.skills,'[]'::jsonb)),
              jsonb_array_length(COALESCE(u.mentor_topics,'[]'::jsonb)),
              jsonb_array_length(COALESCE(u.mentor_objectives,'[]'::jsonb)),
              jsonb_array_length(COALESCE(u.mentee_goals,'[]'::jsonb)),
              jsonb_array_length(COALESCE(u.mentee_challenges,'[]'::jsonb))
       FROM programs_programparticipant pp
       JOIN companies_user u ON u.id=pp.user_id
       WHERE pp.program_id=%s ORDER BY pp.role DESC, u.email""",
    (PID,),
)
for r in cur.fetchall():
    print(r)
conn.close()
print("\nDONE.")
