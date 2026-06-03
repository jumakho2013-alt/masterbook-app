# MasterBook Universal Profession System Design

## Part 1: Profession Taxonomy

The key insight: **profession variance lives on 6 axes**, not in feature lists. Master the axes, and you can compose any profession.

**Axes:**
- **SESSION_SHAPE**: one-shot | recurring | package | project | subscription | drop-in
- **PRICING_UNIT**: per-session | per-hour | per-package | per-project | per-unit (sqm/kg/page) | per-month
- **CLIENT_ENTITY**: human-only | human+pet | human+vehicle | human+property | human+child | b2b-company
- **OUTCOME_TYPE**: visit-log | lesson-progress | case-status | job-report | delivery-handoff | health-record
- **CADENCE**: ad-hoc | weekly-rhythm | milestone-driven | seasonal
- **PRIVACY_CLASS**: standard | health-sensitive | legal-privileged | child-data

### Taxonomy (compressed; 50 rows)

| # | Profession | Session | Pricing | Client | Outcome | Cadence | Privacy | Killer custom field |
|---|---|---|---|---|---|---|---|---|
| 1 | Nails | one-shot | per-session | human | visit-log | ad-hoc | std | preferred shape/color |
| 2 | Hair | one-shot | per-session | human | visit-log | ad-hoc | std | formula/color code |
| 3 | Brows | one-shot | per-session | human | visit-log | ad-hoc | std | last tint, shape map |
| 4 | Lashes | one-shot/package | per-session | human | visit-log | recurring 3w | std | curl/length/volume |
| 5 | Massage | one-shot/package | per-session | human | health-rec | recurring | health | contraindications |
| 6 | Cosmetology | package | per-package | human | health-rec | milestone | health | skin diagnosis, allergies |
| 7 | Depilation | recurring | per-session | human | visit-log | 4w cycle | std | zones treated, growth phase |
| 8 | Tattoo | project | per-project | human | delivery | milestone | std | sketch link, sessions remaining |
| 9 | Piercing | one-shot | per-session | human | health-rec | ad-hoc | health | jewelry size, healing status |
| 10 | Makeup | one-shot | per-session | human | visit-log | event-based | std | event type, look reference |
| 11 | Nutritionist | recurring | per-month sub | human | health-rec | weekly | health | weight log, diet plan |
| 12 | Fitness trainer | package | per-package | human | lesson-prog | 2-3x/week | health | program week, PRs, injuries |
| 13 | Yoga instructor | drop-in/package | per-session | human | lesson-prog | weekly | health | level, contraindications |
| 14 | Physiotherapist | package | per-session | human | health-rec | weekly until disch. | health | diagnosis, exercises, ROM |
| 15 | Psychologist | recurring | per-session | human | case-status | weekly | health | session notes (encrypted) |
| 16 | Speech therapist | recurring | per-session | human+child | lesson-prog | 2x/week | child | sounds worked, homework |
| 17 | School tutor | recurring | per-hour | human+child | lesson-prog | weekly rhythm | child | subject, grade, topic, hw |
| 18 | Language teacher | recurring | per-hour/package | human | lesson-prog | weekly rhythm | std | level (A1-C2), textbook page |
| 19 | Music teacher | recurring | per-session | human+child | lesson-prog | weekly | child | piece, technique focus |
| 20 | Dance teacher | recurring | per-month | human | lesson-prog | weekly | std | choreo progress |
| 21 | Driving instructor | package | per-hour | human | lesson-prog | flexible | std | hours done/30, test date |
| 22 | Course creator | subscription | per-month | human | lesson-prog | self-paced | std | cohort, module complete % |
| 23 | Electrician | project | per-project/hour | human+property | job-report | ad-hoc | std | address, breaker panel notes |
| 24 | Plumber | project | per-project | human+property | job-report | ad-hoc | std | address, last service |
| 25 | Cleaner | recurring | per-hour/sqm | human+property | job-report | weekly/biweek | std | sqm, areas, key location |
| 26 | Mover | project | per-project | human+property | job-report | ad-hoc | std | from/to, volume m³ |
| 27 | Gardener | recurring | per-hour | human+property | job-report | seasonal | std | plot size, plant inventory |
| 28 | Painter | project | per-project/sqm | human+property | job-report | ad-hoc | std | sqm, color codes |
| 29 | Locksmith | one-shot | per-job | human+property | job-report | ad-hoc | std | lock type, address |
| 30 | Photographer | project | per-project | human | delivery | event-based | std | shoot date, deliverable count, gallery link |
| 31 | Videographer | project | per-project | human | delivery | event-based | std | event type, edit deadline |
| 32 | Designer | project | per-project | b2b | delivery | milestone | std | brief, revision count |
| 33 | Illustrator | project | per-project | b2b | delivery | milestone | std | usage rights, format |
| 34 | Copywriter | project | per-word/project | b2b | delivery | milestone | std | tone, word count, deadline |
| 35 | Groomer | recurring | per-session | human+pet | visit-log | 4-6w | std | breed, cut style, behavior |
| 36 | Dog walker | recurring | per-hour/sub | human+pet | visit-log | daily | std | dog name, route, behavior |
| 37 | Vet (private) | one-shot/rec | per-session | human+pet | health-rec | ad-hoc | health | species, breed, vaccines, weight |
| 38 | Pet sitter | project | per-day | human+pet | job-report | event-based | std | feeding sched, meds |
| 39 | Babysitter | recurring | per-hour | human+child | job-report | weekly | child | allergies, bedtime, emergency contact |
| 40 | Party host | one-shot | per-event | human+child | delivery | event-based | child | age group, theme, kids count |
| 41 | Detailer | one-shot/pkg | per-session | human+vehicle | job-report | seasonal | std | make/model/plate, package tier |
| 42 | Mobile mechanic | project | per-job/hour | human+vehicle | job-report | ad-hoc | std | VIN, mileage, parts |
| 43 | Tire service | seasonal | per-job | human+vehicle | job-report | 2x/year | std | tire spec, storage location |
| 44 | Lawyer | project | per-hour/retainer | human/b2b | case-status | milestone | legal | case ID, court, deadline, status |
| 45 | Accountant | subscription | per-month | b2b | case-status | monthly | legal | tax regime, period, docs |
| 46 | Consultant | project | per-hour/project | b2b | delivery | milestone | std | engagement scope, hours used |
| 47 | Life coach | recurring | per-session/pkg | human | lesson-prog | weekly | health | goals, action items |
| 48 | Cake baker | project | per-project | human | delivery | event-based | std | event date, design, allergens, size |
| 49 | Florist | project | per-event | human | delivery | event-based | std | event, palette, delivery time |
| 50 | Wedding planner | project | per-project | human | case-status | milestone | std | wedding date, budget, vendor list |

**Pattern recognition:** the 50 professions collapse into ~12 archetypes by axis combination. That's the real number of "modes" the app needs.

---

## Part 2: Profession-Pack Architecture

### Data model

Keep the core schema generic and stable. Variance moves into JSON.

```ts
// Core (stable)
Client {
  id, name, phone, email, photo, createdAt, notes,
  professionPackId: string,
  custom: Record<string, JSONValue>     // pack-defined fields
  entities: ClientEntity[]              // pets/vehicles/properties/children
}

ClientEntity {
  id, clientId, kind: 'pet'|'vehicle'|'property'|'child'|'company',
  label,                                 // "Барсик", "Toyota Camry А123БВ"
  custom: Record<string, JSONValue>
}

Appointment {
  id, clientId, entityId?,               // which pet/car/etc
  startAt, durationMin, serviceIds[],
  status: PackStatus,                    // pack defines status enum
  outcome: Record<string, JSONValue>,    // pack-defined outcome fields
  attachments[], notes,
  recurrenceRule?,                       // RRULE for recurring
  projectId?                             // for project-based work
}

Project {                                // optional, only for project-based packs
  id, clientId, title, status, milestones[], totalPrice, deliveryDate
}

Service {
  id, name, price, durationMin,
  pricingUnit: 'session'|'hour'|'package'|'sqm'|'kg'|'word'|'project'|'month',
  custom: Record<string, JSONValue>
}
```

### Profession-pack JSON

```jsonc
{
  "id": "tutor.school",
  "version": 1,
  "displayName": { "ru": "Репетитор", "en": "Tutor" },
  "icon": "book-open",
  "archetype": "lesson-recurring",        // drives default UI mode
  "clientEntities": [
    { "kind": "child", "label": "Ученик",
      "fields": [
        { "key": "grade", "type": "select", "options": ["1","2",...,"11"], "required": true },
        { "key": "school", "type": "text" },
        { "key": "parentPhone", "type": "phone" }
      ]
    }
  ],
  "clientFields": [
    { "key": "subject", "type": "select", "options": ["Математика","Английский",...] }
  ],
  "appointmentFields": [
    { "key": "topic", "type": "text", "label": "Тема урока" },
    { "key": "homework", "type": "longtext", "label": "Домашнее задание" },
    { "key": "performance", "type": "rating-5", "label": "Усвоение" }
  ],
  "appointmentStatuses": ["planned","done","missed-by-student","cancelled"],
  "defaultRecurrence": "FREQ=WEEKLY;BYDAY=TU,FR",
  "serviceTemplates": [
    { "name": "Урок 60 мин", "price": 1500, "durationMin": 60, "pricingUnit": "hour" },
    { "name": "Пакет 8 уроков", "price": 11000, "pricingUnit": "package" }
  ],
  "outcomeTemplate": "lesson-recap",      // controls post-session form
  "reminderTemplates": [
    { "trigger": "1h-before", "text": "Через час урок по {{subject}}, тема: {{topic}}" }
  ],
  "documentTemplates": ["tutor-contract", "monthly-receipt"],
  "dashboardWidgets": ["upcoming-week", "students-this-month", "hours-taught"],
  "terminology": {
    "client": "Ученик",
    "appointment": "Урок",
    "service": "Программа"
  }
}
```

### UX handling without exposing complexity

1. **Onboarding picks one pack** → terminology, default services, statuses, screen layout all swap. User never sees "JSON config" — just sees their world.
2. **Single pack at a time per workspace**, but switchable. Custom fields persist in JSONB; switching pack hides/shows them but never deletes.
3. **Pack archetype drives navigation shape:**
   - `visit-recurring` (beauty, groomer): Calendar + Clients + Money (current MasterBook)
   - `lesson-recurring` (tutors, teachers): Calendar with weekly grid prominent + Students + Progress
   - `project-driven` (designers, photographers, contractors): Projects tab replaces Calendar as primary + Clients + Money
   - `case-driven` (lawyers, accountants): Cases tab + Clients + Time-tracking
   - `job-onsite` (plumber, mover): Jobs tab with address+map + Clients + Money
4. **Custom fields render inline** in client/appointment screens with proper types (date picker, photo, rating, etc.). No "Advanced" modal — the pack decides what's first-class.
5. **Search across `custom` JSONB** so "find all clients with breed=Pomeranian" works.

### Community packs

- Packs are JSON. Sharing is trivial.
- v1.5: built-in marketplace, curated. Each pack has a maintainer, version, install count, rating.
- v2.0: user-created packs. Pack editor in-app (form builder for fields, status flow editor). Submit for review or share via link. Revenue split if pack author charges.
- Safety: packs are pure schema, no code execution. Just declarative.

---

## Part 3: 10 Non-Beauty Profession Packs

### 1. `tutor.school` — School Tutor
- **Entity:** child (grade, school, parent phone)
- **Client fields:** subject, weekly rate
- **Appointment fields:** topic, homework, performance rating, materials link
- **Statuses:** planned / done / missed-by-student / cancelled
- **Services:** Урок 60м (1500₽/hr), Пакет 8 уроков (11000₽), Подготовка к ЕГЭ (per month sub)
- **Default cadence:** weekly RRULE (Tue/Fri 18:00)
- **Killer feature:** auto-WhatsApp parent at 8pm: "сегодня прошли {topic}, ДЗ: {homework}"

### 2. `photographer.events` — Event Photographer
- **Archetype:** project-driven
- **Project fields:** shoot date, location, deliverable count, gallery link, retouch deadline
- **Milestones:** booked → prepaid → shot → editing → delivered
- **Services:** Свадебная съёмка (per project), Семейная (3hr), Лавстори (2hr)
- **Pricing:** per-project with 30/70 prepay split
- **Killer feature:** prepayment tracking + auto-reminder "галерея готова, ссылка отправлена 5 дней назад, оплата 70% не получена"

### 3. `vet.private` — Private Veterinarian
- **Entity:** pet (species, breed, DOB, weight, sterilized y/n, chip, vaccines[])
- **Appointment fields:** complaint, diagnosis, prescription, follow-up date
- **Statuses:** scheduled / examined / treatment / observation / closed
- **Privacy:** health-class — notes encrypted at rest
- **Services:** Приём (1500), Вакцинация, Хирургия (per case)
- **Killer feature:** vaccine schedule auto-tracker: "Барсику пора повторить мультикан, прошло 11 мес"

### 4. `plumber.mobile` — Mobile Plumber
- **Entity:** property (address with map pin, building access, key location)
- **Appointment fields:** issue type, work performed, parts used, before/after photos, warranty months
- **Statuses:** call received / scheduled / on-route / done / warranty-issue
- **Services:** Выезд (500₽), Замена крана (per job), Прочистка (1500)
- **Killer feature:** address book with map view, "повторный вызов в течение гарантии" flag

### 5. `cleaner.recurring` — Cleaner
- **Entity:** property (address, sqm, key location, pets, areas)
- **Appointment fields:** areas done, time taken, supplies used, photos
- **Pricing:** per sqm OR per hour (pack supports both, user picks at service-creation)
- **Default cadence:** weekly or biweekly RRULE
- **Services:** Поддерживающая уборка (per sqm), Генеральная, После ремонта
- **Killer feature:** "key is at neighbor #15" surfaced on appointment card; route optimization for multi-client days

### 6. `mechanic.mobile` — Mobile Auto Mechanic
- **Entity:** vehicle (make, model, year, plate, VIN, current mileage)
- **Appointment fields:** symptoms, diagnosis, work done, parts cost, labor cost, next service mileage
- **Services:** Диагностика, Замена масла, Тормоза (per job)
- **Killer feature:** mileage-based reminders "Toyota Camry А123БВ — пора менять масло, прошло 10к км с прошлой замены"

### 7. `psychologist.therapy` — Psychologist
- **Privacy:** legal/health max — biometric required to open, notes encrypted, no cloud by default (local-only mode toggle)
- **Appointment fields:** session number, themes worked, homework, risk flags
- **Default cadence:** weekly same-time slot
- **Services:** Индивидуальная (per session), Пакет 10 (with discount), Парная
- **Killer feature:** "this is session #14, last 3 sessions: themes were anxiety, work, family" — quick recall without exposing in main UI

### 8. `lawyer.private` — Private Lawyer
- **Archetype:** case-driven
- **Case fields:** case number, court, opposing party, next hearing date, status, retainer balance
- **Time tracking:** billable hours per case with description
- **Statuses:** intake / active / awaiting / closed / archived
- **Pricing:** per-hour billable + retainer
- **Killer feature:** "23 case hours billed this month, retainer 50k, used 34k, top up needed" + court calendar synced

### 9. `coach.fitness` — Personal Fitness Trainer
- **Client fields:** goal (lose/gain/maintain), height/weight log, injuries, medical clearance
- **Package model:** "10 тренировок", appointment auto-decrements remaining count
- **Appointment fields:** program week, exercises done, weights, PRs, RPE
- **Killer feature:** "у клиента осталось 2 тренировки из 10, предложить продление" — auto-prompt on session 8

### 10. `designer.freelance` — Freelance Designer
- **Archetype:** project-driven
- **Client kind:** b2b (company name, contact person, billing details)
- **Project fields:** brief link, deliverables, revision count (max 3), deadline, status
- **Milestones:** brief → concept → revision1 → revision2 → final → invoiced → paid
- **Pricing:** per-project, with 50/50 prepay
- **Killer feature:** "revision 4 requested, only 3 included" auto-flag; invoice generation with payment status; "client X has 3 active projects, 142k outstanding"

---

## Why this justifies higher pricing

Once profession-packs land, **value scales by category, not by feature count**:
- A tutor who tracks homework + auto-messages parents = saves 30 min/day = 299₽/mo is a joke; 990₽/mo is fair.
- A lawyer with billable-hours + retainer tracking replaces a 3000₽/mo legal CRM.
- A vet with vaccine reminders + medical history replaces paper cards and angry phone calls.
- A photographer with project pipeline + prepayment chasing replaces Trello + Excel + manual reminders.

The current MasterBook codebase has 80% of the substrate. What's missing for universality:
1. **Client entities table** (pets/vehicles/properties) — 1 migration
2. **Custom JSONB on Client/Appointment/Service** — 1 migration
3. **Profession-pack runtime** (load JSON, render dynamic forms, swap terminology) — ~2 weeks
4. **Project archetype** (new tab, milestones) — ~1 week
5. **Case archetype** (status flow, billable time) — ~1 week
6. **RRULE recurring appointments** — already half-done with reminders, ~3 days
7. **Map view for on-site jobs** — Expo MapView, ~2 days

Total: ~6-8 weeks of focused work to go from "beauty CRM" to "any solo pro CRM" without changing the product's soul. The packs themselves are content, not code.