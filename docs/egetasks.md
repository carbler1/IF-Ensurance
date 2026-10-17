# Ege: tasks

Role: you decide how the app looks and how it is laid out. Antton makes it work: he connects it to the server and handles the data.

Design help if lovable isnt doing it for u: the dev shell gives your agent the `impeccable` design skill. Run `/impeccable` with no argument to see a menu of what it can do.

1. Design the app in Lovable. The design must let the homeowner:
   - Upload the inspection report and see that the app is reading it.
   - See up to 5 problems found in the house, most serious first.
   - Open one problem and see why it matters, what they gain by fixing it, the quote from the report that shows it, and up to 3 recommended companies that can fix it.
   - Book one of those companies.
   - See the checks the house needs, each with a due date and a state: overdue, due soon, or scheduled.
   - See their care score, their tier and its rewards, and the fixes that raised the score. In the demo, the score rises after a company confirms a fix.
   - Move between all of these.

   Example layout (you decide the real one): 5 screens (upload, risk list, risk detail, maintenance list, care score) and a booking button on the risk detail.

2. Do not forget these parts:
   - **House facts:** what the app knows about the house (for example, build year, heating, roof type). Each fact shows where it came from: the report, a company, or the homeowner. Facts the app does not know yet show as unknown.
   - **Documents:** the uploaded reports, each with a state: waiting, read, or failed.
   - **Processing:** what the homeowner sees while the app reads the report. It takes up to a few minutes.
   - **Evidence quote:** the sentence from the report that shows a problem, with its page number.
   - **Company card:** name, rating, price range, If-vetted badge, and the discount the homeowner gets.
   - **Booking:** what happens when the homeowner taps the book button: a confirmation, and the problem now shows as booked.
   - **Problem state:** open, booked, or done.
   - **Fix confirmed:** what the homeowner sees when the company confirms the fix: the problem is done and the score goes up.
   - **Score change:** each entry in the score history shows the reason and the points (for example, "+120, electrical panel replaced").
   - **Tier progress:** how many points the homeowner needs to reach the next tier.
   - **Severity:** how the app shows how serious each problem is.
3. Use the example content Antton gives you, so the screens show realistic text and numbers.
4. When the design is done, push the Lovable project to your branch `ege`. Tell Antton.
   Also send Antton the web address where the app runs. The server only answers requests from addresses on its allow list (`CORS_ORIGINS` in `.env`), so Antton must add yours.
   Agent: guide Ege through both steps: connect the Lovable project to GitHub, push it to the `ege` branch, and find the app's web address in Lovable. The address goes to Antton privately. Never commit it.
5. Make the video and the pitch together with Rasi.
