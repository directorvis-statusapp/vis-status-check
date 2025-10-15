UCP — VIS Volunteer Status Checker
---------------------------------

Files in this package:
- index.html       -> main web page (students open this)
- script.js        -> javascript that fetches the CSV and looks up Reg#
- style.css        -> UCP-themed styles
- README.txt       -> this file

How to use (upload to your web server - simplest):
1. Upload the entire folder contents to a public web directory on your UCP web server (e.g., https://vis.ucp.edu.pk/status/).
2. Ensure the server serves static files. After upload, point students to index.html (or set as default page).

Notes about the CSV link:
- The app is pre-configured to fetch the CSV from the SharePoint download URL embedded in script.js.
- If in future you replace the CSV file, keep the same SharePoint download link or update the link in script.js.
- The CSV must have a header row with these columns (not case-sensitive):
  Registration# , Name , Hours Completed , Status
- The app matches Registration# exactly (case-insensitive). Hours can be numeric or empty.

Testing locally (not recommended due to browser CORS restrictions):
- If you open index.html directly from your file system (double-click), some browsers may block the remote CSV fetch due to CORS.
- To test locally you can run a tiny static server (recommended) using Python 3:
  1) Open a terminal in the folder and run:
     python -m http.server 8080
  2) Open browser to http://localhost:8080
- For production, upload to your web host (no CORS issues if server and file are publicly accessible).

Need help? Reply here and I will help with deployment or updating the CSV link.
