📘 CrewRadar: Microsoft Teams Integration Guide & Technical Notes
1. Overview
This module synchronizes a Jira user's status (Available, Busy, In a Meeting, Away) with their real-time presence in Microsoft Teams. This allows the Auto-Assignment engine to route tickets only to agents who are actually available.
⚠️ Important Context:
This integration was designed as an MVP (Minimum Viable Product) to demonstrate speed and functionality. It uses a heuristic mapping approach (Email first, falling back to Display Name) to link Jira users to Azure AD users without requiring complex Single Sign-On (SSO) or SCIM infrastructure.
________________________________________
2. Azure Entra ID (Azure AD) Configuration
To enable this feature, the administrator must register an application in the Azure Portal.
Required Permissions
The application runs as a background service using Client Credentials Flow. It does not ask individual users to log in; instead, it fetches data on their behalf using global admin consent.
You must grant the following Application Permissions (not Delegated):
API	Permission Name	Type	Justification
Microsoft Graph	User.Read.All	Application	Required to search for users by Email or Display Name to find their Azure Object ID.
Microsoft Graph	Presence.Read.All	Application	Required to read the real-time presence status (Available, Busy, etc.) of the found user.
🛑 Critical Step: After adding these permissions in Azure, an Admin must click "Grant admin consent for [Organization]". Without this, the API calls will fail with a 403 Forbidden error.
________________________________________
3. User Mapping Logic (The "Magic" & The Limitations)
Connecting a Jira Cloud user to a Microsoft Teams user is difficult because their IDs are different, and their email addresses often do not match (e.g., john@company.com in Teams vs. john.doe@atlassian.net in Jira).
To solve this quickly, the index.js backend uses the following Fall-Back Strategy:
Step 1: Attempt Email Match
The app first checks the user's Jira email address against Azure AD.
•	Success: If Azure returns a unique User ID, we use it.
•	Failure: If the emails don't match (common in organizations without strict Azure-to-Atlassian syncing), we move to Step 2.
Step 2: Attempt "Display Name" Match (The Heuristic)
If email fails, the app searches Azure AD using the user's Display Name (e.g., "Ahmet Yılmaz").
Why do we do this?
This method allows the integration to work immediately for 90% of users without requiring IT to fix email aliasing issues. It prioritizes speed of setup.
How do we handle Duplicate Names? (e.g., Multiple "John Doe"s)
If the Azure search returns multiple users with the same name:
1.	The app fetches the Real-Time Presence for all of them.
2.	The "Active User" Assumption: It assumes that the "John Doe" currently active in Jira (triggering the heartbeat) is likely the same "John Doe" who is online in Teams.
3.	It selects the first candidate who is Online (Available/Busy/Away).
4.	If everyone is Offline, it defaults to the first result.
________________________________________
4. Technical Code Walkthrough (index.js)
Here is how the backend code handles the integration:
1.	saveTeamsConfig: Stores the TenantId, ClientId, and ClientSecret in Forge Storage.
2.	getGraphToken:
o	Uses the credentials to hit https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token.
o	Requests a token for https://graph.microsoft.com/.default.
3.	sendHeartbeat (The Core Loop):
o	This function runs every 30 seconds from the frontend.
o	It calls getMsUserIdForEmail. If that returns null...
o	It calls getMsUsersForDisplayName.
o	It calls getTeamsPresenceForUserId to get the status (e.g., Available).
o	Finally, it maps the Teams status to a Jira status (e.g., Teams Busy -> Jira In a Meeting).
________________________________________
5. Known Limitations & Future Improvements
Since this is an MVP implementation, please note the following areas for improvement in a production environment:
1.	Duplicate Name Risk:
o	Current: If two people named "Mehmet Demir" are both online at the same time, the system might map to the wrong person.
o	Improvement: Implement a UI in the Admin Panel to manually map Jira Users to specific Azure Object IDs if the automatic detection fails.
2.	API Rate Limits:
o	Current: Every user heartbeat triggers multiple Graph API calls.
o	Improvement: Implement caching for the Jira User -> Azure ID mapping so we don't search by name on every single heartbeat, only checking Presence.
3.	Security Model:
o	Current: Uses Client Credentials (God-mode read access).
o	Improvement: Switch to On-Behalf-Of (OBO) flow, where the user explicitly logs into Microsoft within the Jira app. This is more secure but requires a much more complex setup (User Interaction).
________________________________________
6. Summary for the Administrator
•	Ensure Names Match: If emails differ, tell users to ensure their "Display Name" in Jira matches their "Display Name" in Teams exactly.
•	Grant Consent: Ensure "Grant Admin Consent" is clicked in Azure.
•	Latency: There may be a delay of up to 30-60 seconds between a status change in Teams and it appearing in Jira due to the heartbeat interval.

Steps:
 
 
 
 
 
 
 
