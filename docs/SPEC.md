# Advanced Gym Management Software — Master Feature Specification

> Source: "Advanced Gym Management Software Feature Specification v2" (PDF, v1.0, 25 Nov 2026), converted to Markdown for use in this repository.
> Requirement IDs (A1, B2, I3a, …) are taken from the original document and should be referenced in code, PRs and tests.

**Purpose:** A comprehensive feature inventory and dashboard planning reference for a complete gym operating system — from QR-based enquiries and membership management to inventory, personal training, challenges, digital screens, finance, analytics and multi-branch operations.

## Document Map

The primary sidebar has 24 modules (A–X) plus one cross-cutting technical section (Y).

| ID | Module |
|---|---|
| A | Main Dashboard |
| B | Customer Enquiry & QR Form Management |
| C | Member Management |
| D | Membership & Package Management |
| E | Attendance & Access Management |
| F | Supplement & Canteen Management |
| G | Freebies, Complimentary Items & Rewards |
| H | Personal Training & Trainer Management |
| I | Workout, Fitness & Body Assessment |
| J | Running Challenges & Competitions |
| K | Birthday, Celebrations & Member Recognition |
| L | Gym Screen & Digital Display Management |
| M | Group Classes & Bookings |
| N | Marketing, CRM & Member Retention |
| O | Finance, Billing & Accounting |
| P | Staff & HR Management |
| Q | Equipment & Asset Management |
| R | Facility, Housekeeping & Safety |
| S | Member Mobile App & Self-Service Portal |
| T | Reports & Business Analytics |
| U | Multi-Branch & Franchise Management |
| V | Notifications & Automation Centre |
| W | Admin Panel, User Roles & Security |
| X | Integrations & API Management |
| Y | Cross-cutting: Platform, Technical & Non-Functional Requirements |

**Navigation principle:** keep the primary sidebar limited to these modules. Individual functions appear as submenus, tabs, page sections or contextual actions — not as hundreds of separate sidebar entries.

## Product Structure & Design Principles
- One inventory ledger: Supplement, canteen, freebies, internal consumption, damage, expiry and stock transfers must update one auditable stock ledger.
- One transaction source of truth: Invoices, payments, refunds, discounts and settlements must reconcile across membership, POS, PT and accounting screens.
- Central notification engine: WhatsApp, SMS, email and push notifications should use one template, consent, scheduling and delivery-tracking system.
- Role-based access: Each role should see only the data and actions required for its responsibilities. Sensitive financial, health and payroll data needs stricter access.
- Automation with approval controls: Automate routine work, but require approval for sensitive actions such as refunds, stock adjustments, manual attendance overrides and winner publication.
- Branch-ready architecture: Even if the first deployment has one gym, structure the data and permissions so branches can be added without rebuilding the platform.
- Mobile-first member experience: Members should be able to view membership, pay, book, check progress and receive notifications without depending on the reception desk.

## Module A — Main Dashboard
The command centre for owners and managers.

### A1 Overview Dashboard
- Total registered members; active members; inactive members.
- New members today and this month; expiring memberships; expired memberships.
- Today's enquiries; today's attendance; live gym occupancy.
- Total revenue today; monthly revenue; pending payments; total expenses; estimated profit.
- Personal training revenue; supplement sales; canteen sales.
- Membership renewal rate; member retention rate.
- Comparison with previous day, week, month and financial year.
- Customizable dashboard widgets and date/branch filters.

### A2 Quick Actions
- Add new member; add new enquiry; register walk-in customer.
- Generate invoice; receive payment; check in a member.
- Assign trainer; create membership; book PT session.
- Add expense; record stock purchase; issue complimentary item.
- Create challenge; add announcement; open support ticket.

### A3 Alerts & Notifications
- Membership expiry and expired-membership alerts.
- Pending payment and overdue balance alerts.
- Inactive-member and missed-workout alerts.
- Low-stock, reorder-level and product-expiry alerts.
- Upcoming birthday and scheduled celebration alerts.
- PT session and PT package expiry alerts.
- Pending lead follow-ups and unresolved complaints.
- Equipment maintenance, staff absence and facility inspection alerts.
- Important administrative and integration-failure notifications.

### A4 Live Statistics
- Live occupancy; check-ins; check-outs; peak-hour statistics.
- Active trainers; ongoing classes; challenge leaderboard highlights.
- Upcoming birthdays; screen content currently playing.
- Capacity utilization and visitor count.

## Module B — Customer Enquiry & QR Form Management
Build and manage customer forms from the backend, then publish them through QR codes.

### B1 Dynamic Form Builder
- Create, edit, duplicate, archive and delete forms.
- Add unlimited sections; rename, reorder, enable or disable sections.
- Add questions and fields; make fields mandatory or optional.
- Support short text, long text, number, date, dropdown, single-choice and multiple-choice fields.
- Support file, photograph and document uploads.
- Support consent, declaration and terms acceptance fields.
- Conditional logic: show or hide questions based on previous answers.
- Form preview, validation and custom thank-you message.
- Multiple-language support and mobile-responsive forms.
- Form version history, activation dates, expiry dates and access controls.
- Configure fields and sections without developer intervention.

### B2 QR Code Management
- Generate a unique QR code for each form or campaign.
- Download and print QR codes.
- Assign QR codes to reception, advertisements, events, posters or specific locations.
- Track QR scans, unique visitors, completed submissions and incomplete forms.
- Disable, reactivate or replace a QR code.
- QR-code-wise enquiry and conversion reports.

### B3 Enquiry Management
- View form submissions and automatically create CRM leads.
- Assign enquiries to sales staff, teams or branches.
- Track source, date, form version and QR campaign.
- Contact customer, schedule follow-ups and record remarks.
- Manage lead stages: new, contacted, interested, visit scheduled, visit completed, trial, negotiation, converted or lost.
- Record lost-lead reason; convert an enquiry into a member.
- Detect duplicate leads and match existing members.
- Export enquiries and measure lead-to-member conversion.

## Module C — Member Management
The central customer/member database used by every module.

### C1 Member Registration
- Automatic unique member ID and membership card number.
- Name, photograph, mobile number, WhatsApp number and email address.
- Date of birth, address and optional demographic details.
- Emergency contact name, number and relationship.
- Registration date, joining date and lead source.
- Occupation and fitness goals, where voluntarily provided.
- Assigned trainer and membership selection.
- Health declaration, injury notes and relevant precautions with restricted access.
- Document uploads, digital agreement, waiver and signature.
- Consent records and date/time of acceptance.

### C2 Member Directory
- All members; active; inactive; expired; suspended; frozen.
- VIP; personal training; trial; corporate; couple and family members.
- Search by name, member ID, mobile number or email.
- Filter by membership, trainer, branch, joining date, status and activity.
- Bulk import from Excel/CSV and export to Excel/CSV/PDF.
- Duplicate detection, merge and data validation.

### C3 Member Profile & Timeline
- Personal information, membership information and renewal history.
- Payment history, invoices, refunds and outstanding balances.
- Attendance history, visit frequency and check-in/check-out times.
- Assigned trainer, PT sessions and session balance.
- Workout plans, exercise history and progress.
- Body assessment, measurements and progress photographs.
- Diet plans, nutrition logs and goals.
- Freebies issued, rewards earned and referral history.
- Challenge participation, rankings and achievements.
- Complaints, feedback, staff notes and communication history.
- Uploaded documents and complete member activity timeline.

### C4 Member Operations
- Edit details; deactivate/reactivate; suspend/unsuspend.
- Change membership; upgrade; downgrade; freeze; unfreeze; extend.
- Transfer member between branches, subject to policy.
- Cancel membership and record reason/approval.
- Merge duplicate profiles while retaining an audit trail.
- Request data correction or export and manage consent withdrawal.

## Module D — Membership & Package Management
Create flexible membership products and manage their full lifecycle.

### D1 Membership Package Types
- Monthly, quarterly, half-yearly, annual and custom-duration plans.
- Daily pass, weekly pass, trial and limited-visit passes.
- Student, couple, family and corporate memberships.
- Off-peak, premium, VIP, cardio-only and custom plans.
- General gym access, group-class access and bundled service plans.

### D2 Package Configuration
- Package name, description, price, duration and validity rules.
- Access timings, branch access and usage restrictions.
- Joining fee, registration fee, tax category and discount rules.
- Included PT sessions, group classes, guest passes and other benefits.
- Complimentary/freebie entitlements and redemption limits.
- Package terms, cancellation, freeze, transfer and refund policies.
- Promotional pricing, coupon codes and early-renewal discounts.

### D3 Membership Lifecycle
- Create, activate, renew, upgrade, downgrade and extend membership.
- Freeze, unfreeze, transfer, cancel and reactivate membership.
- Calculate start date, expiry date, remaining validity and payment due.
- Configure grace period, freeze limits and permitted extensions.
- Automatic reminders before expiry and after expiry.
- Maintain complete membership history and approval trail.

### D4 Package Performance
- Most-selling and least-selling plans.
- Package-wise active members, sales and revenue.
- Package-wise renewals, cancellation and retention rates.
- Discount usage, coupon performance and package profitability.

## Module E — Attendance & Access Management
Validate entitlement and record member entry accurately.

### E1 Member Attendance
- QR check-in/check-out; unique member QR codes.
- Member ID card scanning; RFID/NFC; fingerprint or other biometric integration.
- Mobile app check-in and front-desk manual check-in.
- Automatic timestamp, duplicate-entry prevention and visit history.
- Guest, visitor, trial and day-pass attendance.
- Offline attendance capture with later synchronization.

### E2 Attendance Rules & Access
- Block or flag expired, suspended or otherwise ineligible memberships.
- Optional payment-dues checks before entry, based on gym policy.
- Access rules by membership type, time window and branch.
- Maximum occupancy and capacity-limit controls.
- Turnstile, gate, scanner and access-control hardware integration.
- Authorized manual override with staff identity and reason.
- Unauthorized entry logs and emergency manual entry mode.

### E3 Attendance Reports
- Daily, weekly and monthly attendance.
- Member-wise and trainer-wise attendance.
- Peak-hour and least-used-hour reports.
- Member visit frequency, average time spent and repeat visits.
- Inactive-member lists and missed-workout identification.
- Live occupancy, average daily occupancy and capacity utilization.

## Module F — Supplement & Canteen Management
Manage retail products, food service, procurement, stock movement and sales.

### F1 Product & Brand Catalogue
- Create, edit, archive and categorize products.
- Product name, category, brand, manufacturer and supplier.
- SKU/product code, barcode, photograph and description.
- Purchase price, MRP, selling price, discount and tax/GST settings.
- Product variants such as size, weight, flavour, pack and unit.
- Batch number, manufacturing date and expiry date.
- Brand-wise and category-wise product catalogue.

### F2 Supplement Store
- Categories such as whey protein, creatine, pre-workout, amino acids, vitamins/minerals, protein bars and mass gainers.
- Brand-wise, flavour-wise, size-wise and batch-wise inventory.
- Product stock, pricing, sales, returns and expiry tracking.
- Product descriptions, usage information and display status.
- Supplier and purchase history for each product.

### F3 Canteen & Cafe
- Create menu categories and food/beverage items.
- Manage shakes, drinks, meals, snacks, combos and add-ons.
- Set item price, tax, availability and preparation time.
- Maintain ingredient-level recipes and quantities.
- Record raw-material stock and automatic ingredient consumption.
- Dine-in, takeaway and counter orders.
- Kitchen order ticket/display and order statuses.
- Cancelled orders, wastage, complimentary servings and staff meals.
- Daily canteen sales, food cost and item-level profitability.

### F4 Stock Inward / Procurement
- Opening stock and purchase entry.
- Supplier selection, purchase order and goods-received note.
- Upload purchase invoice and record invoice number/date.
- Record received quantity, unit, purchase price, batch and expiry.
- Record shortages, excess quantity, damaged stock and rejected goods.
- Supplier returns, purchase returns and vendor credit notes.
- Automatic stock increase after approved goods receipt.

### F5 Stock Outward / Consumption
- Stock out through sale, freebie issue and canteen consumption.
- Internal consumption, staff issue and sampling/promotional use.
- Damaged, expired, lost and wasted stock.
- Branch/warehouse transfers and supplier returns.
- Stock adjustment with reason, supporting evidence and approval.
- Automatic stock deduction after completed sale or approved issue.

### F6 Inventory Control
- Opening, current and closing stock.
- Central stock movement ledger with user, date, quantity and reason.
- Low-stock alerts, reorder quantity and preferred supplier.
- Physical stock count, cycle count and reconciliation.
- Batch-wise and expiry-wise stock tracking.
- Brand-wise, supplier-wise and product-wise stock reports.
- Stock valuation and inventory audit trail.

### F7 POS & Retail Sales
- Quick billing, barcode scanning and product search.
- Select member/customer and apply eligible member/PT discounts.
- Coupons, promotional discounts and authorized price overrides.
- Cash, UPI, card and supported split-payment methods.
- Invoice/receipt generation and WhatsApp/email delivery.
- Sales return, exchange, cancellation and refund workflows.
- Daily cash closing, cashier-wise and salesperson-wise sales.
- Product-wise sales, gross margin and profit reports.

## Module G — Freebies, Complimentary Items & Rewards
Control what is promised, who is eligible, what is issued and what it costs.

### G1 Freebie Catalogue
- Add, edit and archive freebie items.
- Freebie name, category, brand, photograph and description.
- Unit, quantity, cost per item, available stock and validity.
- Link freebie catalogue items to inventory SKUs.

### G2 Eligibility & Rules
- Benefits for standard, PT, premium and VIP memberships.
- New-joining, renewal, referral and birthday freebies.
- Challenge-winner, festival and promotional freebies.
- Package-wise freebie entitlements and quantity limits.
- One-time or recurring benefit rules and redemption window.
- Eligibility by membership duration, status, branch or campaign.
- Approval requirements and rules for substitutions.

### G3 Distribution & Redemption
- Issue freebie to member or PT client.
- Select item, quantity, date, issuing staff and reason.
- Check eligibility and available stock before issue.
- Capture member acknowledgment/signature where required.
- Approval workflow for exceptional issues.
- Automatic stock deduction and member-profile update.
- Correction, reversal and return process with audit trail.

### G4 Freebie & Reward Reports
- Total freebies issued and current balance.
- Member-wise, PT client-wise and package-wise distribution.
- Freebie cost, campaign cost and redemption rate.
- Freebie stock balance and low-stock alerts.
- Staff-wise issue reports and exception reports.
- Loyalty points, reward catalogue and redemption history.

## Module H — Personal Training & Trainer Management
Manage trainers, PT packages, sessions, commissions and client relationships.

### H1 Trainer Profiles & HR Link
- Trainer profile, photograph and contact details.
- Specialization, qualifications, certifications and experience.
- Availability calendar, working shifts and attendance.
- Assigned clients, workload, leave and replacement trainer.
- Salary, incentives and commission configuration.

### H2 PT Package Management
- Create PT packages with price, session count and validity.
- Configure package benefits, discounts and freebie entitlements.
- Assign package to member and record payment.
- Allocate PT sessions and calculate remaining balance.
- Handle package extension, transfer, pause and cancellation under policy.

### H3 PT Session Management
- Book, schedule, reschedule and cancel sessions.
- Assign trainer, member, date, time and location.
- Mark completed, missed, cancelled or no-show sessions.
- Deduct session balance only according to configured rules.
- Track expiry, remaining sessions and session history.
- Member feedback and trainer notes.

### H4 Trainer Performance & Reports
- Trainer-wise clients, sessions, attendance and utilization.
- PT revenue, commission, incentives and payment status.
- Client progress and retention.
- Member ratings and feedback.
- Pending sessions, expiring packages and missed sessions.
- Monthly performance review and target tracking.

## Module I — Workout, Fitness & Body Assessment
Provide training tools and track member fitness progress.

### I1 Exercise Library
- Exercise name, category and target muscle group.
- Equipment required, difficulty level and instructions.
- Images, demonstration videos and safety notes.
- Alternative exercises and equipment substitutions.
- Search and filters by muscle, equipment and difficulty.

### I2 Workout Planner & Tracking
- Create reusable daily, weekly and monthly workout templates.
- Beginner, intermediate and advanced plans.
- Push-pull-legs, body-part split, strength, fat-loss and muscle-building plans.
- Assign plans to members and trainers.
- Sets, repetitions, load/weight, tempo, rest time and notes.
- Mark exercises and workouts completed.
- Workout calendar, modification history and exercise substitutions.
- Personal records, progressive overload and adherence tracking.
- Workout reminders and performance history.

### I3 Body Assessment & Transformation
- Initial and repeat fitness assessments.
- Height, weight, BMI, body-fat percentage and muscle mass.
- Chest, waist, shoulder, hip, arm, forearm, thigh and calf measurements.
- Before/after and monthly progress photographs with member consent.
- Goal setting, target weight, target body fat and progress percentage.
- Trainer remarks and member-facing progress reports.
- InBody/body-composition equipment integration where supported.
- PDF assessment reports and assessment reminders.

### I3a Assessment Record, Muscle Sizes & Historical Tracking
- Create a separate assessment record for every check, with assessment date and exact time; never overwrite earlier measurements.
- Record the assessor/trainer, branch/location, measurement method, device/source (manual, weighing scale, body-composition analyser or InBody) and notes.
- Capture height, body weight, BMI, BMR, body-fat percentage, fat mass, lean body mass, total muscle mass and skeletal muscle mass where available.
- Store BMR value together with its calculation/source method; distinguish an estimated BMR from a device-reported value.
- Track circumference/body sizes: chest, waist/abdomen, hips, shoulders, neck, upper arm, forearm, thigh and calf.
- Support separate left/right measurements for arms, forearms, thighs and calves, plus flexed/relaxed arm measurements where required.
- Optionally capture device-supported metrics such as visceral fat, subcutaneous fat, body-water percentage, bone mass and metabolic age.
- Maintain a complete date-wise assessment history for each member, including who recorded each value and any corrections with an audit trail.
- Compare any two assessment dates and show absolute change, percentage change and trend charts for weight, BMI, BMR, body fat, muscle mass and each body measurement.
- Link progress photographs to the exact assessment date and store/display them only with member consent.
- Allow configurable measurement units (cm/in, kg/lb) and preserve the original recorded value and unit.

### I4 Diet & Nutrition
- Diet profile, dietary preferences and food allergy/intolerance notes.
- Calorie, protein, carbohydrate and fat targets.
- Meal-wise diet plans and reusable templates.
- Food database, portion calculator and nutrition information.
- Daily food log, macro tracking and water-intake tracking.
- Diet adherence, modifications, reminders and progress reports.
- Plans created or reviewed by appropriately qualified professionals.

## Module J — Running Challenges & Competitions
Create short-term and long-term challenges, verify results and publish rankings.

### J1 Challenge Creation
- Create challenge name, description, image and rules.
- Short-term, long-term, daily, weekly, monthly and custom-duration challenges.
- Start/end dates and registration opening/closing dates.
- Free or paid entry and participation eligibility.
- Categories, age/experience groups where appropriate and branch eligibility.
- Prize details, reward rules and tie-breaking criteria.

### J2 Participant Management
- Member registration and participant ID.
- Participant list, category, status and registration date.
- Participation start/end dates and completion status.
- Withdrawals, disqualifications and rule violations.
- Participant profile and performance history.

### J3 Running & Activity Tracking
- Distance covered, duration, pace and number of runs.
- Daily, weekly and total distance.
- GPS/app-based records and supported wearable integration.
- Manual result entry with evidence upload.
- Admin verification and correction workflow.
- Duplicate activity and suspicious-result checks.

### J4 Leaderboards
- Distance-based, time-based and consistency-based ranking.
- Daily, weekly, category-wise and overall leaderboards.
- Participant progress and ranking history.
- Tie-breaking and final result verification.
- Public/member-only display settings.

### J5 Winners & Prizes
- First, second and third positions and category winners.
- Admin approval before winner publication.
- Winner name, approved photograph, achievement and prize.
- Prize issue/redemption tracking and participant acknowledgment.
- Certificate generation and past-winner archive.
- Publish approved winners on the gym digital screen and member app.

### J6 Challenge Reports
- Total, active, completed, withdrawn and disqualified participants.
- Total distance and participation/completion percentages.
- Challenge-wise performance and branch-wise participation.
- Prize distribution and challenge cost reports.

## Module K — Birthday, Celebrations & Member Recognition
Automate personalized celebrations while controlling consent and display.

### K1 Birthday Management
- Capture date of birth in member profile.
- Today, upcoming, weekly and monthly birthday lists.
- Birthday calendar and configurable reminder schedule.
- Birthday message templates and personalized greeting cards.
- Birthday offers, coupons and complimentary gifts.
- Birthday greeting and benefit history.

### K2 WhatsApp Birthday Automation
- Connect an approved WhatsApp Business messaging provider.
- Create approved message templates with member-name and gym-name variables.
- Schedule automated wishes at configurable time.
- Send text, greeting cards and eligible personalized offers.
- Track opt-in/opt-out, delivery, failure and retry status.
- Prevent duplicate birthday messages.

### K3 Gym Screen Birthday Wishes
- Display birthday greeting, member name and approved photograph.
- Use gym-branded birthday templates.
- Configure display duration, schedule, screen and priority.
- Preview and approve content before publishing.
- Allow member opt-in/opt-out from public birthday display.
- Maintain display history.

### K4 Other Celebrations
- New-member welcome and membership milestones.
- Member transformation and achievement announcements.
- Challenge winner and competition announcements.
- Trainer appreciation, gym anniversary and festival greetings.
- Custom events and recognition campaigns.

## Module L — Gym Screen & Digital Display Management
Control televisions and digital signage through a central backend.

### L1 Screen Management
- Add and identify each screen with a unique screen ID.
- Screen name, physical location and branch assignment.
- Connect multiple screens and group screens by zone.
- Monitor online/offline status and last-seen time.
- Assign content and playlists by screen or screen group.
- Configure display settings where supported.

### L2 Display Content Library
- Birthday wishes and member celebrations.
- Running challenge leaderboards and verified winners.
- Member achievements and consented transformation content.
- Gym announcements, notices and upcoming events.
- Membership promotions, supplement advertisements and canteen offers.
- Group-class timetable, gym photographs, videos and motivational content.
- Festival greetings and emergency notices.

### L3 Playlist & Scheduling
- Create, edit and order playlists.
- Upload images and videos; create text notices.
- Schedule start/end dates and time windows.
- Configure slide duration, repeat interval and transition rules.
- Select target screens and screen groups.
- Preview, pause, stop and publish content.
- Emergency announcement override and content approval.
- Display history and failed-playback monitoring.

### L4 Templates & Automation
- Birthday, winner, leaderboard, promotion and achievement templates.
- Custom logo, colours, typography and layout.
- Auto-create draft display items from birthday and challenge modules.
- Require admin approval before public display where configured.

## Module M — Group Classes & Bookings
Schedule instructor-led sessions and manage capacity.

### M1 Class Catalogue
- Yoga, Zumba, spinning, HIIT, functional training and custom classes.
- Class name, description, category, image and instructor.
- Duration, studio/location and equipment requirements.

### M2 Scheduling
- Create one-time and recurring classes.
- Assign instructor, date, time, duration and room.
- Configure capacity, membership eligibility and price.
- Weekly/monthly calendar and instructor availability.

### M3 Bookings & Attendance
- Member booking, cancellation and rescheduling.
- Waiting list and automatic promotion when a place opens.
- Attendance, no-show tracking and booking reminders.
- Paid bookings, refunds and cancellation policies.

### M4 Class Reports
- Class-wise attendance and capacity utilization.
- Instructor performance and member participation.
- Cancellation/no-show and class revenue reports.

## Module N — Marketing, CRM & Member Retention
Convert leads, communicate with members and reduce avoidable churn.

### N1 CRM Pipeline
- New, contacted, interested, visit scheduled, visit completed and trial leads.
- Converted, lost and reactivation stages.
- Lead assignment, follow-up schedule, reminders and remarks.
- Lead-source tracking and duplicate detection.
- Salesperson targets, response time and performance.

### N2 Marketing Campaigns
- WhatsApp, SMS, email and push campaigns.
- Festival, referral, membership promotion and renewal campaigns.
- Coupons, discount codes and targeted offers.
- Former-member reactivation and lost-lead campaigns.
- Campaign audience segmentation and scheduling.
- Campaign cost, delivery, response and conversion reporting.

### N3 Retention & Loyalty
- Identify inactive and at-risk members.
- Missed-workout and low-engagement alerts.
- Renewal reminders and win-back campaigns.
- Feedback requests, satisfaction surveys and complaints follow-up.
- Loyalty points, referrals, rewards and redemption.
- Member engagement, retention and churn reports.

### N4 Communication Templates
- Welcome, birthday, payment due and membership expiry messages.
- Renewal, PT session and group-class reminders.
- Challenge announcements, winner announcements and freebie notifications.
- Custom templates with approved variables and language variants.

## Module O — Finance, Billing & Accounting
Provide a reliable financial record for every membership, PT and retail transaction.

### O1 Billing & Invoices
- Automatic invoice and receipt generation with unique numbering.
- GST-enabled invoice configuration, CGST/SGST and IGST where applicable.
- Business details, GSTIN and financial-year settings.
- Credit notes, cancelled invoices, refunds and invoice corrections.
- Discounts, taxes, coupons and custom invoice layouts.
- PDF download and WhatsApp/email delivery.

### O2 Payment Management
- Cash, UPI, QR, debit/credit card, bank transfer and online gateway.
- Full, partial, advance and installment payments.
- Payment links and supported recurring/mandate payments.
- Gateway transaction IDs, payment failure and webhook status updates.
- Outstanding balance and due-date tracking.
- Refund approval, reconciliation and payment history.
- Cash drawer opening/closing, shift handover and cashier reconciliation.

### O3 Expenses & Vendors
- Record rent, electricity, water, salaries, marketing and internet expenses.
- Equipment purchase, repair, maintenance and cleaning expenses.
- Supplement/canteen procurement and other operating expenses.
- Expense categories, receipts, approvals and recurring expenses.
- Vendor directory, bills, payments, outstanding dues and credit notes.

### O4 Accounting & Tax Reports
- Cashbook, bankbook and bank reconciliation.
- Income and expenditure, profit and loss and cash-flow reports.
- Outstanding member dues and vendor balances.
- GST input/output summaries and tax reports.
- Financial-year closing and downloadable statements.
- Tally or Zoho Books integration.

## Module P — Staff & HR Management
Manage employees, attendance, shifts, payroll and performance.

### P1 Employee Directory
- Staff profile, photograph, contact details and emergency contact.
- Designation, department, reporting manager and branch.
- Joining date, employment status and staff documents.
- Qualifications, certifications and document expiry reminders.
- Joining, transfer, exit and rehire records.

### P2 Attendance, Shifts & Leave
- Staff attendance and biometric integration.
- Shift planning, rotation, weekly offs and shift handover.
- Late arrival, early departure and overtime tracking.
- Leave application, approval and leave balance.
- Attendance correction with authorization.

### P3 Payroll & Compensation
- Salary structure, payroll calculation and payslip generation.
- Salary advances, deductions, incentives and allowances.
- Trainer commissions and salesperson incentives.
- Overtime and attendance-linked payroll rules.
- Salary history and payroll reports.

### P4 Tasks & Performance
- Assign daily and recurring tasks to staff.
- Opening/closing, cleaning, stock and safety checklists.
- Task due dates, reminders, proof and completion verification.
- Staff targets, performance reviews, feedback and warnings.
- Individual activity and approval logs.

## Module Q — Equipment & Asset Management
Track machines, assets, warranty, faults, repairs and lifecycle costs.

### Q1 Equipment Register
- Equipment name, category, brand, manufacturer and model.
- Serial number, purchase date, purchase price and supplier.
- Warranty period, installation date and location in gym.
- Photographs, manuals, invoices and asset ID.
- QR code on each machine for identification and fault reporting.

### Q2 Maintenance & Repairs
- Preventive maintenance schedule and reminders.
- Breakdown report, fault description and priority.
- Repair request, technician assignment and status tracking.
- Spare parts, repair cost and vendor information.
- Inspection checklist, maintenance history and machine downtime.
- Operational, under-maintenance and unavailable status.

### Q3 Asset Lifecycle
- Furniture, electrical equipment, computers, CCTV and office assets.
- Asset assignment, location and movement history.
- Depreciation, replacement planning and disposal.
- Asset verification and periodic audit.

## Module R — Facility, Housekeeping & Safety
Maintain the gym environment, shared facilities and incident records.

### R1 Facility & Locker Management
- Locker register, allocation, availability and locker status.
- Key issue/return, deposit and overdue key tracking.
- Changing rooms, washrooms, showers and drinking-water stations.
- Parking management where applicable.
- Lost-and-found register and item return records.

### R2 Housekeeping
- Daily cleaning schedule and task assignment.
- Machine cleaning, washroom, locker-room and shower inspections.
- Cleaning staff attendance and task verification.
- Housekeeping consumables and low-stock tracking.
- Gym opening and closing checklists.

### R3 Safety & Security
- Emergency contacts and evacuation procedure.
- First-aid inventory and replenishment.
- Incident, injury and accident register.
- Fire extinguisher and fire-safety inspections.
- CCTV and security-system status.
- Security staff attendance and incident notifications.
- Incident evidence, follow-up and closure records.

## Module S — Member Mobile App & Self-Service Portal
Let members manage their account and services without relying on reception.

### S1 Member Account
- Secure login, OTP and profile management.
- Digital membership card and personal QR code.
- Membership status, renewal, payment history and invoice download.
- Family-linked accounts where permitted.

### S2 Fitness & Engagement
- Workout plans, exercise videos and workout logging.
- Diet plan, water tracking and fitness goals.
- Body assessment and progress reports.
- Challenge registration, running progress and leaderboards.
- Achievements, streaks, badges and rewards.

### S3 Bookings & Support
- PT appointment and group-class booking.
- Membership freeze/extension request.
- Feedback, complaint and support-ticket submission.
- Gym announcements, push notifications and WhatsApp support.
- Referral and reward tracking.

## Module T — Reports & Business Analytics
Provide filters, comparisons and exports across every operational area.

### T1 Membership Reports
- Active, inactive, new, renewed, expired, frozen and cancelled members.
- Package-wise members, revenue, renewal and cancellation rates.
- Membership tenure and member retention.

### T2 Financial Reports
- Daily, weekly, monthly and annual collections.
- Payment-mode, outstanding dues, refunds and discounts.
- Expenses, gross revenue, operating profit and cash flow.
- Average revenue per active member and customer lifetime value.

### T3 Sales & Inventory Reports
- Supplement and canteen sales by product, category and brand.
- Product margin, stock movement, returns, wastage and expiry.
- Inventory valuation, low stock and stock adjustment history.
- Freebie issue count, freebie cost and campaign cost.

### T4 Fitness & Trainer Reports
- PT sessions, trainer attendance, utilization, revenue and commission.
- Workout adherence, body progress and transformation reports.
- Class attendance, instructor performance and capacity usage.

### T5 Challenge & Engagement Reports
- Challenge registrations, participation, completion and distance.
- Leaderboard history, winner records and prize distribution.
- Birthday campaign delivery and member engagement.
- Digital display content activity and playback status.

### T6 Advanced Business Intelligence
- Monthly recurring revenue where recurring contracts are used.
- Customer acquisition cost and customer lifetime value.
- Member churn, retention and renewal forecasts.
- Revenue per active member, branch profitability and revenue per square foot.
- Peak-hour utilization, trainer utilization and class occupancy.
- Growth comparisons and AI-generated business summaries.
- Export all reports to Excel/CSV/PDF; schedule report delivery.

## Module U — Multi-Branch & Franchise Management
Make the platform ready for multiple gyms and franchise operations.

### U1 Branch Management
- Create branches with address, contact, operating hours and settings.
- Assign branch manager and employees.
- Branch-specific members, packages, pricing and policies.
- Branch attendance, revenue, expenses and inventory.
- Inter-branch member access and transfer rules.
- Inventory transfer between branches.

### U2 Centralized & Franchise Management
- Central dashboard and consolidated reports.
- Centralized or branch-specific campaigns and templates.
- Branch comparison and performance ranking.
- Franchise onboarding and franchise-specific access.
- Royalty/commission calculation and settlement reporting.
- Central governance with branch-level permissions.

## Module V — Notifications & Automation Centre
Manage all outbound messages and automated business rules centrally.

### V1 Communication Channels
- WhatsApp Business messaging provider integration.
- SMS gateway, email service, push notifications and in-app alerts.
- Approved templates, variables, language variants and media attachments.
- Consent/opt-in and opt-out management.

### V2 Automated Messages
- Welcome, birthday, payment due and membership expiry messages.
- Renewal, inactive-member and missed-workout reminders.
- PT session, class booking and challenge announcements.
- Winner, freebie issue, complaint update and promotional messages.
- Custom event and manager-triggered messages.

### V3 Automation Rules & Delivery
- Trigger-based, date-based, membership-based and attendance-based rules.
- Payment, birthday, stock, challenge and approval-based triggers.
- Configurable delay, schedule, frequency cap and quiet hours.
- Delivery status, failure logs, retries and duplicate prevention.
- Automation history, pause/disable controls and test mode.

## Module W — Admin Panel, User Roles & Security
Control access, system settings, audit trails and data protection.

### W1 User & Role Management
- Super admin, owner, general manager and branch manager.
- Receptionist, trainer, accountant, salesperson and store manager.
- Housekeeping, security and custom roles.
- Create, edit, deactivate and reset user accounts.

### W2 Permissions & Approvals
- View, create, edit, delete, export and approve permissions.
- Module-level and action-level access.
- Financial, payroll and health-data restrictions.
- Branch-specific access and data visibility.
- Approval workflows for refunds, discounts, stock adjustments and manual overrides.

### W3 Security & Audit
- Strong password rules, OTP and two-factor authentication.
- Login, device, session and suspicious-access history.
- Automatic logout and session revocation.
- Encryption in transit and at rest.
- Audit logs for creation, modification, deletion and approval.
- Soft delete and authorized recovery of records.
- Consent, privacy and retention settings.
- Backup, restore and disaster-recovery controls.

### W4 System Configuration
- Gym name, logo, address, contact details and branding.
- GST/tax settings, invoice numbering and financial year.
- Membership, attendance, QR, stock and notification settings.
- Custom fields, form builder settings and languages.
- Time zone, date format, theme and other organization settings.

## Module X — Integrations & API Management
Connect payment, communication, access, accounting, marketing and fitness systems.

### X1 Business Integrations
- Razorpay or another supported payment gateway; UPI and payment links.
- WhatsApp Business provider, SMS gateway and email service.
- Tally or Zoho Books accounting integration.
- Website enquiry, registration and member portal integration.
- Google Analytics, Meta Ads and Google Ads lead/measurement integrations.

### X2 Hardware & Fitness Integrations
- QR scanners, RFID/NFC readers and biometric devices.
- Turnstile/access gates and supported access controllers.
- CCTV status or event integration where supported.
- InBody/body composition machines.
- Smartwatch, running app and fitness wearable services.

### X3 API Operations
- API keys, scopes and access permissions.
- Webhooks for payment, membership, check-in and notification events.
- Integration status, health checks and error logs.
- Retry queue, failure alerts and reconciliation tools.
- Documentation, sandbox/testing credentials and versioning.

## Module Y — Platform, Technical & Non-Functional Requirements
Set a reliable foundation for performance, scale, data integrity and maintainability.

### Y1 Application Platforms
- Responsive web dashboard for desktop, tablet and mobile.
- Member-facing Android and iOS apps, or a progressive web app as an initial release.
- Staff-facing mobile experience for trainers and operational teams.
- Central administration interface and optional white-label branding.

### Y2 Architecture & Data
- Cloud-hosted application and centralized database.
- API-first architecture and modular services.
- Real-time or near-real-time synchronization between connected portals.
- Multi-branch and, if commercial SaaS is intended, multi-tenant isolation.
- Central member, payment, inventory, notification and permission services.
- Data import/export and migration tools.

### Y3 Reliability & Operations
- Offline check-in capture and safe synchronization after reconnection.
- Automated backups with tested restoration procedures.
- Disaster recovery, monitoring, error logging and uptime alerts.
- Scalable search, pagination and report generation.
- Development, testing/staging and production environments.
- Automated tests for billing, memberships, permissions and stock movements.
- Version-controlled releases and rollback strategy.

### Y4 Privacy, Security & Performance
- Encrypt sensitive data in transit and at rest.
- Least-privilege access and separation of sensitive health/payroll data.
- Consent-controlled use of photographs, birthday display and marketing messages.
- Configurable data retention and secure deletion/export workflows.
- Performance targets for login, search, check-in and common dashboard actions.
- Accessibility, readable typography and consistent responsive layouts.

## Additional Operational Details Checklist

Easy-to-overlook requirements that belong inside the relevant modules rather than being left as manual work.

| Area | Additional details |
|---|---|
| Members & Reception | Member ID card printing; digital waiver and health declaration; emergency contact and consent history; visitor register; guest pass and trial pass; daily reception opening/closing checklist; cash drawer opening and closing. |
| Membership & Payments | Membership cancellation reasons; freeze reasons, freeze limits and approval; membership transfer approval; refund approval; failed transaction reconciliation; cash handover between shifts; receipt reprint and invoice correction history. |
| CRM & Customer Service | Follow-up reminders and salesperson targets; duplicate-lead detection; complaint ticketing; escalation and resolution target; customer communication history; lead attribution and referral attribution. |
| Freebies & Inventory | Member acknowledgment for issued items; purchase returns and vendor credit notes; batch/expiry/damage reports; stock audit; stock adjustment approval; vendor price history; minimum and maximum stock levels. |
| Canteen | Recipe-level ingredient consumption; kitchen order display; order queue; food wastage; staff meal/complimentary item tracking; item availability by time; cashier shift close. |
| Challenges & Digital Screens | Anti-cheating and result verification; winner approval before publication; public-display privacy consent; emergency screen override; screen offline alert; content scheduling and playback history. |
| PT & Fitness | Trainer replacement; session transfer; exercise alternatives; workout completion history; trainer notes; assessment reminders; progress report export. |
| Classes & Staff | Booking waitlist; cancellation/no-show rules; employee document expiry reminders; shift handover; recurring task checklists; staff activity log. |
| Facility & Safety | Locker deposit and key return; lost-and-found; first-aid replenishment; incident documentation; equipment QR fault reporting; machine downtime and maintenance checklist. |
| Reports & System | Excel/CSV/PDF export; bulk member import; migration from previous software; offline mode and recovery synchronization; automated backup and restore testing; report scheduling. |

## Cross-Module Automation Workflows

The modules must work as one system. A successful action in one module updates all related records automatically, subject to configured approvals.

### WF1. QR enquiry to active member
- Customer scans a QR code and completes a backend-configured form.
- Submission creates a CRM lead with QR/form/source attribution.
- Sales staff receives assignment and follow-up task.
- After conversion, the system creates/links one member profile.
- Membership and payment are recorded; invoice and digital QR card are generated.
- Welcome communication is triggered and trainer onboarding can be assigned.

### WF2. Member check-in
- Member scans QR/card or uses an approved access method.
- System checks membership status, access hours, branch entitlement and configured dues rules.
- Attendance is recorded and live occupancy is updated.
- Trainer sees the member visit where permitted; attendance reports refresh.

### WF3. Supplement or canteen sale
- Cashier creates POS order and records payment.
- Sale invoice/receipt is generated.
- Supplement SKU stock or recipe ingredient stock is deducted.
- Sales, tax, cash drawer and inventory ledger are updated.
- Return/cancellation reverses the correct records with an audit trail.

### WF4. Freebie issue
- System checks member eligibility and available freebie stock.
- Authorized staff selects item and quantity.
- Member acknowledgment is captured where required.
- Stock ledger deducts quantity and member profile records the benefit.
- Freebie cost and distribution reports update.

### WF5. PT package and sessions
- Member purchases a PT package and completes payment.
- PT session balance and package expiry are created.
- Trainer schedules and completes sessions.
- Valid completed sessions reduce the balance and update trainer records.
- Commission and PT revenue reports update.

### WF6. Birthday automation
- Birthday scheduler identifies eligible members.
- WhatsApp message is sent using an approved template and consent settings.
- Where display consent exists, a birthday slide is queued for selected gym screens.
- Delivery and screen display history are logged.

### WF7. Running challenge to winner display
- Member registers for a challenge and submits supported activity records.
- System validates/queues records for verification.
- Leaderboard is recalculated using published scoring rules.
- Admin approves final results and winners.
- Winner announcement is published to the gym screen and member app.

### WF8. Membership renewal
- System identifies memberships approaching expiry.
- Configured reminders and renewal offers are sent.
- Member pays online or at reception.
- Validity is extended and invoice/payment records are updated.
- Access status and dashboard statistics refresh.

### WF9. Inactivity and retention
- System detects a configurable period without visits.
- Assigned trainer and/or retention team receives an alert.
- An approved WhatsApp/push workflow may contact the member.
- Follow-up result is recorded in CRM/member timeline.

### WF10. Equipment maintenance
- Staff scans equipment QR code and reports a fault.
- Maintenance ticket is created and manager/technician is assigned.
- Machine status changes to under maintenance if approved.
- Repair, spare parts, cost and downtime are recorded.
- Machine returns to operational status after authorized closure.

## User Portals & Role-Specific Dashboards

Do not expose every module to every user. Build role-specific navigation over the same central data model.
- Owner portal: Full business overview, revenue, profit, members, staff, all branches, analytics, approvals and system alerts.
- Reception/front-desk portal: Registration, enquiry forms, leads, payments, renewals, member search, check-in, visitor register and customer support.
- Trainer portal: Assigned members, attendance, workout plans, assessments, PT schedule, session completion, progress and trainer performance.
- Accountant portal: Invoices, receipts, collections, expenses, vendor bills, refunds, reconciliation, tax summaries and financial reports.
- Member portal/app: Membership, QR card, payments, attendance, workouts, diet, bookings, challenges, progress, rewards and support.
- Branch manager portal: Branch operations, employees, attendance, sales, expenses, stock, facility tasks and branch reports.
- Store/canteen portal: Products, suppliers, purchase receiving, stock movements, POS, canteen orders, expiry, wastage and sales close.
- Super admin portal: Organization setup, users, roles, integrations, global settings, audit logs, system monitoring and security.

## Suggested Development Roadmap (from the original spec)

| Phase | Scope | Priority |
|---|---|---|
| Phase 1 — Core operations | Dashboard; member records; memberships; QR enquiry forms; billing and payments; attendance/access; user roles; core reports. | Must-have foundation |
| Phase 2 — Member experience | CRM follow-ups; WhatsApp; member app/portal; renewal workflows; trainers; PT; workouts; assessments; diet. | High priority |
| Phase 3 — Retail & engagement | Supplement and canteen POS; stock ledger; freebies; birthday automation; gym screens; challenges and leaderboards. | High differentiation |
| Phase 4 — Back-office operations | Finance/accounting enhancements; HR/payroll; equipment maintenance; lockers; housekeeping; safety; service tickets. | Operational depth |
| Phase 5 — Scale | Multi-branch; franchise; consolidated reporting; branch inventory; advanced role controls; white-label options. | Expansion-ready |
| Phase 6 — Intelligence & connected hardware | AI business assistant; churn/renewal prediction; advanced analytics; wearable/body composition integration; access hardware automation. | Premium capabilities |

## Development Governance & Acceptance Checklist

- [ ] Every feature has a unique requirement ID, owner role, permission, status and acceptance criteria.
- [ ] Every form field and form section is configurable from the backend where specified.
- [ ] Each transaction has a unique ID, timestamp, user, branch and audit history.
- [ ] Inventory movements reconcile: opening stock + inward - outward = closing stock, with adjustments explained.
- [ ] Payment, refund, invoice and membership status remain synchronized.
- [ ] Freebie issues reduce stock and appear in the member history and cost reports.
- [ ] Birthday WhatsApp and gym-screen workflows honor consent and avoid duplicate messages.
- [ ] Challenge rankings use published rules and winners cannot be published until approved.
- [ ] Gym screens can be monitored, scheduled, paused and overridden by authorized users.
- [ ] Role permissions are tested for both allowed and prohibited actions.
- [ ] Offline check-in and synchronization are tested for duplicate and conflicting records.
- [ ] Backups are restored in a test environment before production launch.
- [ ] Excel/CSV/PDF exports preserve filters and totals accurately.
- [ ] Critical flows have automated tests and a documented support/incident process.

## Important Scope & Design Decisions

- Own gym vs commercial SaaS: If the first use is one gym but the long-term goal is to sell subscriptions to other gyms, design tenant isolation, gym-level subscription billing, onboarding, white-label branding and platform administration from the beginning.
- Manual vs automated integrations: QR forms, payment gateways, WhatsApp, biometric readers, turnstiles, InBody devices and wearables depend on provider APIs, hardware compatibility and credentials. Treat each as an integration with a defined vendor and test plan.
- Public gym-screen content: Birthday photographs, transformation pictures, names and other personal content should be displayed only with an appropriate member permission and configurable audience controls.
- AI and health-related recommendations: AI fitness and nutrition features should be advisory, transparently labeled and subject to qualified professional review where appropriate. Do not use AI as a substitute for medical assessment.
- Financial and stock controls: Refunds, write-offs, manual stock changes, discounts beyond limits and attendance overrides should have approval rules and complete audit records.

## Final Product Definition

The target product is a complete gym operating system with one central database and connected portals for owners, reception, trainers, accountants, members, store/canteen staff, branch managers and platform administrators.

- Operational management: enquiries, members, memberships, attendance, payments, staff and facility operations.
- Fitness management: trainers, PT, workouts, assessments, nutrition, challenges and member progress.
- Commercial management: supplement store, canteen, inventory, freebies, sales, finance and retention.
- Engagement and communication: QR forms, WhatsApp, birthdays, challenges, digital gym screens and member app.
- Business intelligence: dashboards, reports, forecasting, branch comparison and AI-assisted insights.
- Platform foundation: secure role-based access, audit trails, integrations, backups, multi-branch readiness and scalable architecture.
