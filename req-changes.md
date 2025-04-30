1   A notification alert is required if a message is not responded to within a threshold. An audio alert should be triggered continuously.

2   During ticket creation, fetch the following details from LMS: IMEI number and HP motorcycle. These fields should be non-editable.

3   Remove the status dropdown during ticket creation for user role.

4   Remove the delete option for the user role in the ticket card, Show the close option for both user and admin.

6   Maintain a table to track conversations closed due to inactivity or by an admin.

7   Display the username who updated the conversation in the popup.

8   Show images and audio in the conversation and add a ticket button on the homepage.

9   Define user roles as "Technical User" and "Admin."

10  Display the date in conversations.

11  The notification audio alert is required only for technical users.

12  Show the IMEI number on the ticket card. Use a socket server to capture the first response time in minutes for every ticket and display this as a card.

13  At the end of the day, provide a summary: tickets created, tickets not responded to by users, average first response time, tickets closed by users, tickets automatically closed after two days, and WhatsApp notifications.

14  Display a dashboard with the above details for the past 7 days.

15  The dashboard should include state-wise HP and type-based ticket statistics.

16  Send a daily report to the admin via WhatsApp, including user ticket counts and first response times, broken down by day.

17  Provide month-to-date (MTD) statistics.

18  Upon closure, the technical team should be able to map reasons for closure using tags. Technical users should also be able to create these tags.

19  Maintain a calendar for working hours and enable auto-responses for messages received outside this window. Calculate the first response time based on working hours and allow holidays to be set manually for auto-responses.

20  Working hours:
     - 9:32 AM to 1:00 PM
     - 2:00 PM to 5:30 PM
     - Monday to Saturday