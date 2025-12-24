import Resolver from '@forge/resolver';
import { storage, route, asApp, fetch } from '@forge/api';

const resolver = new Resolver();

// ========================
// 1. USER / PROJECT / GROUP
// ========================

resolver.define('getMyself', async (req) => {
  const { accountId } = req.payload || {};
  if (!accountId) {
    return { accountId: null, displayName: 'Crew Member', avatarUrl: null, email: null };
  }

  try {
    const res = await asApp().requestJira(
      route`/rest/api/3/user?accountId=${accountId}`
    );
    if (!res.ok) {
      console.error('getMyself error:', res.status, await res.text());
      return { accountId, displayName: 'Crew Member', avatarUrl: null, email: null };
    }
    const data = await res.json();
    const email = data.emailAddress || null;
    console.log(
      `getMyself: accountId=${accountId}, displayName=${data.displayName}, email=${email}`
    );
    return {
      accountId: data.accountId,
      displayName: data.displayName || 'Crew Member',
      avatarUrl:
        (data.avatarUrls && (data.avatarUrls['48x48'] || data.avatarUrls['32x32'])) ||
        null,
      email,
    };
  } catch (e) {
    console.error('getMyself exception:', e);
    return { accountId, displayName: 'Crew Member', avatarUrl: null, email: null };
  }
});

resolver.define('getJSMProjects', async () => {
  try {
    const res = await asApp().requestJira(
      route`/rest/api/3/project/search?expand=lead,insight&maxResults=1000`
    );
    if (!res.ok) {
      console.error('getJSMProjects error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const all = data.values || [];

    const jsmProjects = all.filter((p) => {
      if (p.projectTypeKey === 'service_desk') return true;
      if (p.insight && typeof p.insight.totalIssues === 'number') return true;
      return false;
    });

    console.log(
      'JSM projects found:',
      jsmProjects.map((p) => ({ id: p.id, key: p.key, name: p.name }))
    );
    return jsmProjects;
  } catch (e) {
    console.error('getJSMProjects exception:', e);
    return [];
  }
});

resolver.define('getRequestTypes', async (req) => {
  const { projectId } = req.payload;

  try {
    const sdListRes = await asApp().requestJira(
      route`/rest/servicedeskapi/servicedesk?limit=1000`
    );
    if (!sdListRes.ok) {
      console.error(
        'getRequestTypes: servicedesk list error',
        sdListRes.status,
        await sdListRes.text()
      );
      return [];
    }
    const sdListData = await sdListRes.json();
    const allServiceDesks = sdListData.values || [];

    let allRequestTypes = [];

    for (const sd of allServiceDesks) {
      const sdId = sd.id;
      const rtRes = await asApp().requestJira(
        route`/rest/servicedeskapi/servicedesk/${sdId}/requesttype?limit=1000`
      );
      if (!rtRes.ok) {
        console.error(
          `RequestType list error for SD=${sdId}`,
          rtRes.status,
          await rtRes.text()
        );
        continue;
      }
      const rtData = await rtRes.json();
      const values = rtData.values || [];
      const mapped = values.map((rt) => ({
        id: String(rt.id),
        name: rt.name,
        issueTypeId: rt.issueTypeId,
        serviceDeskId: sdId,
      }));
      allRequestTypes = allRequestTypes.concat(mapped);
    }

    console.log('Total RT across all SDs:', allRequestTypes.length);

    const projRes = await asApp().requestJira(route`/rest/api/3/project/${projectId}`);
    if (!projRes.ok) {
      console.error('Project fetch error:', projRes.status, await projRes.text());
      return [];
    }
    const projData = await projRes.json();
    const projectIssueTypes = (projData.issueTypes || []).map((it) => String(it.id));
    console.log(`Project ${projectId} issueTypes:`, projectIssueTypes);

    const filtered = allRequestTypes.filter(
      (rt) => rt.issueTypeId && projectIssueTypes.includes(String(rt.issueTypeId))
    );
    console.log(
      `Filtered RT for project ${projectId}:`,
      filtered.map((r) => ({ id: r.id, name: r.name }))
    );
    return filtered;
  } catch (e) {
    console.error('getRequestTypes exception:', e);
    return [];
  }
});

resolver.define('getGroups', async () => {
  try {
    const res = await asApp().requestJira(
      route`/rest/api/3/group/bulk?maxResults=1000`
    );
    if (!res.ok) {
      console.error('getGroups error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const groups = data.values || [];
    console.log('Groups found:', groups.map((g) => g.name));
    return groups.map((g) => ({ name: g.name }));
  } catch (e) {
    console.error('getGroups exception:', e);
    return [];
  }
});

resolver.define('getGroupMembers', async (req) => {
  const { groupName } = req.payload || {};
  if (!groupName) return [];

  try {
    const members = await getAllGroupMembers(groupName);
    return members.map((m) => ({
      accountId: m.accountId,
      displayName: m.displayName,
      avatarUrl:
        (m.avatarUrls && (m.avatarUrls['48x48'] || m.avatarUrls['32x32'])) || null,
    }));
  } catch (e) {
    console.error('getGroupMembers exception:', e);
    return [];
  }
});

async function getAgentGroupName() {
  const res = await asApp().requestJira(
    route`/rest/api/3/group/bulk?maxResults=1000`
  );
  if (!res.ok) {
    console.error('getAgentGroupName group list error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const groups = data.values || [];
  const agentGroup = groups.find(
    (g) => g.name && g.name.startsWith('jira-servicemanagement-users-')
  );
  if (!agentGroup) {
    console.warn('No jira-servicemanagement-users-* group found');
    return null;
  }
  console.log('Using JSM agent group:', agentGroup.name);
  return agentGroup.name;
}

async function getAllGroupMembers(groupName) {
  const members = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const res = await asApp().requestJira(
      route`/rest/api/3/group/member?groupname=${groupName}&startAt=${startAt}&maxResults=${maxResults}`
    );
    if (!res.ok) {
      console.error(
        `group/member error for ${groupName} startAt=${startAt}:`,
        res.status,
        await res.text()
      );
      break;
    }
    const data = await res.json();
    const values = data.values || [];
    members.push(...values);
    if (values.length < maxResults) break;
    startAt += maxResults;
  }

  return members;
}

// ========================
// 2. RULE CONFIG
// ========================

resolver.define('saveConfig', async (req) => {
  try {
    const { rules } = req.payload || {};
    const safeRules = Array.isArray(rules) ? rules : [];
    await storage.set('CONFIG_RULES', safeRules);
    console.log('💾 CONFIG_RULES saved:', safeRules);
    return { success: true };
  } catch (e) {
    console.error('saveConfig error:', e);
    return { success: false, error: e.toString() };
  }
});

resolver.define('getConfig', async () => {
  try {
    const rules = await storage.get('CONFIG_RULES');
    if (!Array.isArray(rules)) {
      await storage.set('CONFIG_RULES', []);
      return { rules: [] };
    }
    return { rules };
  } catch (e) {
    console.error('getConfig error:', e);
    return { rules: [] };
  }
});

// ========================
// 3. MS TEAMS CONFIG & TEST & USER FLAG
// ========================

resolver.define('saveTeamsConfig', async (req) => {
  const { enabled, tenantId, clientId, clientSecret } = req.payload || {};
  const cfg = {
    enabled: !!enabled,
    tenantId: (tenantId || '').trim(),
    clientId: (clientId || '').trim(),
    clientSecret: (clientSecret || '').trim(),
  };
  await storage.set('MS_TEAMS_CONFIG', cfg);
  console.log('💾 MS_TEAMS_CONFIG saved:', {
    ...cfg,
    clientSecret: cfg.clientSecret ? '***' : '',
  });
  return { success: true };
});

resolver.define('getTeamsConfig', async () => {
  const cfg =
    (await storage.get('MS_TEAMS_CONFIG')) || {
      enabled: false,
      tenantId: '',
      clientId: '',
      clientSecret: '',
    };
  return {
    ...cfg,
    clientSecret: cfg.clientSecret ? '***MASKED***' : '',
  };
});

resolver.define('testTeamsConnection', async () => {
  console.log('🔌 testTeamsConnection called');
  const token = await getGraphToken();
  if (!token) {
    console.log('testTeamsConnection: FAILED (no token)');
    return {
      success: false,
      message:
        'Could not obtain Graph token. Check tenantId/clientId/clientSecret and Presence.Read.All + User.Read.All application permissions in Azure.',
    };
  }
  console.log('testTeamsConnection: OK (token acquired)');
  return { success: true, message: 'Successfully obtained Graph token.' };
});

resolver.define('getUserTeamsSync', async (req) => {
  const { accountId } = req.payload || {};
  if (!accountId) return { syncFromTeams: false };
  const data =
    (await storage.get(`MS_TEAMS_SYNC_${accountId}`)) || {
      syncFromTeams: false,
    };
  return data;
});

resolver.define('setUserTeamsSync', async (req) => {
  const { accountId, syncFromTeams } = req.payload || {};
  if (!accountId) return { success: false, error: 'accountId required' };
  await storage.set(`MS_TEAMS_SYNC_${accountId}`, {
    syncFromTeams: !!syncFromTeams,
  });
  console.log(`MS Teams sync flag for ${accountId}:`, !!syncFromTeams);
  return { success: true };
});

// ========================
// 4. MS GRAPH HELPERS
// ========================

async function getGraphToken() {
  const cfg = await storage.get('MS_TEAMS_CONFIG');
  console.log('getGraphToken: current config:', {
    ...(cfg || {}),
    clientSecret: cfg?.clientSecret ? '***' : '',
  });

  if (!cfg || !cfg.enabled) {
    console.log('getGraphToken: disabled or missing.');
    return null;
  }
  if (!cfg.tenantId || !cfg.clientId || !cfg.clientSecret) {
    console.log(
      'getGraphToken: incomplete config (tenantId/clientId/clientSecret required).'
    );
    return null;
  }

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  }).toString();

  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }
    );
    if (!res.ok) {
      console.error('Graph token error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    console.log(
      'getGraphToken: token received, length=',
      (data.access_token || '').length
    );
    return data.access_token;
  } catch (e) {
    console.error('Graph token exception:', e);
    return null;
  }
}

async function getMsUserIdForEmail(token, email) {
  if (!email) return null;
  const cacheKey = `MS_TEAMS_USERMAP_${email.toLowerCase()}`;
  const cached = await storage.get(cacheKey);
  if (cached && cached.msUserId) {
    console.log(
      `getMsUserIdForEmail: cached for ${email} -> ${cached.msUserId}`
    );
    return cached.msUserId;
  }

  const filter = encodeURIComponent(`mail eq '${email.replace("'", "''")}'`);
  const url = `https://graph.microsoft.com/v1.0/users?$select=id,mail,userPrincipalName&$filter=${filter}`;
  console.log(`getMsUserIdForEmail: calling Graph, email=${email}`);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.error('Graph user lookup error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const users = data.value || [];
    if (!users.length) {
      console.log(`getMsUserIdForEmail: no user found for email=${email}`);
      return null;
    }
    const user = users[0];
    console.log(
      `getMsUserIdForEmail: found id=${user.id} upn=${user.userPrincipalName}`
    );
    await storage.set(cacheKey, { msUserId: user.id });
    return user.id;
  } catch (e) {
    console.error('Graph user lookup exception:', e);
    return null;
  }
}

// DISPLAY NAME üzerinden Teams user listesi (multi-user)
async function getMsUsersForDisplayName(token, displayName) {
  if (!displayName) return [];

  const key = displayName.toLowerCase();
  const cacheKey = `MS_TEAMS_USERMAP_DISPLAYNAME_LIST_${key}`;
  const cached = await storage.get(cacheKey);
  if (cached && Array.isArray(cached.users) && cached.users.length) {
    console.log(
      `getMsUsersForDisplayName: cached ${cached.users.length} users for "${displayName}"`
    );
    return cached.users;
  }

  const searchQuery = encodeURIComponent(`"displayName:${displayName}"`);
  const url = `https://graph.microsoft.com/v1.0/users?$search=${searchQuery}`;

  console.log(
    `getMsUsersForDisplayName: calling Graph search, displayName="${displayName}"`
  );

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'ConsistencyLevel': 'eventual',
      },
    });

    if (!res.ok) {
      console.error(
        'Graph user lookup (displayName search) error:',
        res.status,
        await res.text()
      );
      return [];
    }

    const data = await res.json();
    const users = (data.value || []).map((u) => ({
      id: u.id,
      displayName: u.displayName,
      mail: u.mail,
      userPrincipalName: u.userPrincipalName,
    }));

    console.log(
      `getMsUsersForDisplayName: found ${users.length} users for displayName="${displayName}"`
    );

    await storage.set(cacheKey, { users });
    return users;
  } catch (e) {
    console.error('Graph user lookup (displayName search) exception:', e);
    return [];
  }
}

async function getTeamsPresenceForUserId(token, msUserId) {
  console.log(`getTeamsPresenceForUserId: msUserId=${msUserId}`);
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${msUserId}/presence`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) {
      console.error('Graph presence error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    console.log('getTeamsPresenceForUserId: presence=', data);
    return data;
  } catch (e) {
    console.error('Graph presence exception:', e);
    return null;
  }
}

function mapTeamsAvailabilityToCrewStatus(availability, activity) {
  const a = (availability || '').toLowerCase();
  const act = (activity || '').toLowerCase();

  if (a === 'available') return 'Available';
  if (a === 'busy' || a === 'do_not_disturb') {
    if (act.includes('meeting') || act.includes('call')) return 'In a meeting';
    return 'Busy';
  }
  if (a === 'away' || a === 'be_right_back') return 'Away';
  if (a === 'offline') return 'Off Work (out of office)';
  return 'Available';
}

function isOfflinePresence(availability) {
  const a = (availability || '').toLowerCase();
  return !a || a === 'offline' || a === 'unknown';
}

// ========================
// 5. USER STATUS / HEARTBEAT
// ========================

resolver.define('updateStatus', async (req) => {
  const { status, accountId } = req.payload;
  console.log(`updateStatus: accountId=${accountId}, status=${status}`);
  const existing = (await storage.get(`USER_${accountId}`)) || {};
  await storage.set(`USER_${accountId}`, {
    ...existing,
    status,
    lastHeartbeat: new Date().toISOString(),
  });
  return { success: true };
});

resolver.define('sendHeartbeat', async (req) => {
  const { accountId } = req.payload;
  if (!accountId) return { success: false, error: 'accountId required' };

  const syncData =
    (await storage.get(`MS_TEAMS_SYNC_${accountId}`)) || {
      syncFromTeams: false,
    };
  const cfg =
    (await storage.get('MS_TEAMS_CONFIG')) || { enabled: false };
  console.log(
    `sendHeartbeat: accountId=${accountId}, syncFromTeams=${syncData.syncFromTeams}, teamsEnabled=${cfg.enabled}`
  );

  if (cfg.enabled && syncData.syncFromTeams) {
    try {
      const userRes = await asApp().requestJira(
        route`/rest/api/3/user?accountId=${accountId}`
      );
      if (!userRes.ok) {
        console.error(
          'sendHeartbeat: user lookup error',
          userRes.status,
          await userRes.text()
        );
      } else {
        const userData = await userRes.json();
        const email = userData.emailAddress || null;
        const displayName = userData.displayName || null;
        console.log(
          `sendHeartbeat: Jira user for ${accountId} -> displayName="${displayName}", email=${email}`
        );

        const token = await getGraphToken();
        if (!token) {
          console.log('sendHeartbeat: could not obtain Graph token.');
        } else {
          let chosenUserId = null;
          let chosenPresence = null;

          // 1) Email ile tek user ID dene
          if (email) {
            const msUserId = await getMsUserIdForEmail(token, email);
            if (msUserId) {
              const presence = await getTeamsPresenceForUserId(token, msUserId);
              if (presence && presence.availability) {
                chosenUserId = msUserId;
                chosenPresence = presence;
                console.log(
                  `sendHeartbeat: mapped via email to msUserId=${msUserId}, availability=${presence.availability}`
                );
              }
            }
          }

          // 2) Email yoksa veya presence alınamadıysa, displayName ile multi-user search
          if (!chosenUserId && displayName) {
            console.log(
              `sendHeartbeat: email not available or mapping failed, trying displayName mapping for "${displayName}"`
            );
            const users = await getMsUsersForDisplayName(token, displayName);
            if (users.length) {
              const presences = [];
              for (const u of users) {
                const p = await getTeamsPresenceForUserId(token, u.id);
                if (p && p.availability) {
                  presences.push({ user: u, presence: p });
                }
              }

              if (!presences.length) {
                console.log(
                  `sendHeartbeat: no presence data returned for any user of displayName="${displayName}"`
                );
              } else {
                const nonOffline = presences.filter(
                  (x) => !isOfflinePresence(x.presence.availability)
                );
                const offlineOnly = presences.filter((x) =>
                  isOfflinePresence(x.presence.availability)
                );

                let picked;
                if (nonOffline.length) {
                  picked = nonOffline[0];
                  console.log(
                    `sendHeartbeat: picked non-offline user id=${picked.user.id}, availability=${picked.presence.availability}, totalCandidates=${presences.length}`
                  );
                } else {
                  picked = offlineOnly[0];
                  console.log(
                    `sendHeartbeat: all candidates offline, picked first offline user id=${picked.user.id}, availability=${picked.presence.availability}, totalCandidates=${presences.length}`
                  );
                }

                if (picked) {
                  chosenUserId = picked.user.id;
                  chosenPresence = picked.presence;
                }
              }
            } else {
              console.log(
                `sendHeartbeat: no Graph users found for displayName="${displayName}"`
              );
            }
          }

          const stored = (await storage.get(`USER_${accountId}`)) || {};
          if (!chosenUserId || !chosenPresence) {
            console.log(
              'sendHeartbeat: could not map user to any msUserId (email or displayName). Falling back to manual status.'
            );
            await storage.set(`USER_${accountId}`, {
              ...stored,
              status: stored.status || 'Available',
              lastHeartbeat: new Date().toISOString(),
            });
            return { success: true, source: 'manual', status: stored.status || 'Available' };
          } else {
            const mappedStatus = mapTeamsAvailabilityToCrewStatus(
              chosenPresence.availability,
              chosenPresence.activity
            );
            console.log(
              `sendHeartbeat: final mapped Teams presence to status=${mappedStatus} (msUserId=${chosenUserId})`
            );
            await storage.set(`USER_${accountId}`, {
              ...stored,
              status: mappedStatus,
              lastHeartbeat: new Date().toISOString(),
              lastPresence: {
                msUserId: chosenUserId,
                availability: chosenPresence.availability,
                activity: chosenPresence.activity,
                sequenceNumber: chosenPresence.sequenceNumber,
                workLocation: chosenPresence.workLocation || null,
                isOutOfOffice:
                  chosenPresence.outOfOfficeSettings?.isOutOfOffice || false,
                mappedStatus,
              },
            });
            return { success: true, source: 'teams', status: mappedStatus };
          }
        }
      }
    } catch (e) {
      console.error('sendHeartbeat Teams sync exception:', e);
    }
  }

  // Fallback/manual
  const stored = (await storage.get(`USER_${accountId}`)) || {};
  const currentStatus = stored.status || 'Available';
  console.log(
    `sendHeartbeat: manual/fallback status for ${accountId} = ${currentStatus}`
  );
  await storage.set(`USER_${accountId}`, {
    ...stored,
    status: currentStatus,
    lastHeartbeat: new Date().toISOString(),
  });
  return { success: true, source: 'manual', status: currentStatus };
});

resolver.define('getStatus', async (req) => {
  const { accountId } = req.payload;
  const data = (await storage.get(`USER_${accountId}`)) || {};
  const status = data.status || 'Available';
  const lastPresence = data.lastPresence || null;

  return {
    status,
    lastHeartbeat: data.lastHeartbeat || new Date().toISOString(),
    presenceDetails: lastPresence,
  };
});

resolver.define('getAllAgentStatuses', async () => {
  try {
    const groupName = await getAgentGroupName();
    if (!groupName) return [];

    const members = await getAllGroupMembers(groupName);
    const now = Date.now();
    const agents = [];

    for (const m of members) {
      const accountId = m.accountId;
      if (!accountId) continue;

      const stored = (await storage.get(`USER_${accountId}`)) || {};
      const status = stored.status || 'Available';
      const lastHeartbeat = stored.lastHeartbeat || null;

      let isOnline = false;
      let minutesAgo = null;

      if (lastHeartbeat) {
        const diffMin =
          (now - new Date(lastHeartbeat).getTime()) / 60000;
        minutesAgo = Math.round(diffMin);
        if (diffMin <= 10) isOnline = true;
      }

      agents.push({
        accountId,
        displayName: m.displayName || 'Agent',
        avatarUrl:
          (m.avatarUrls &&
            (m.avatarUrls['48x48'] || m.avatarUrls['32x32'])) ||
          null,
        status,
        lastHeartbeat,
        isOnline,
        minutesAgo,
        groupName,
      });
    }

    agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
    console.log('getAllAgentStatuses result count:', agents.length);
    return agents;
  } catch (e) {
    console.error('getAllAgentStatuses exception:', e);
    return [];
  }
});

// ========================
// 6. AUTO-ASSIGN
// ========================

const CUSTOMER_REQUEST_TYPE_FIELD_ID = 'customfield_10010';

export const runAutoAssign = async (event) => {
  console.log(
    '🏎️ CrewRadar: Atama Motoru Tetiklendi!',
    JSON.stringify(event, null, 2)
  );

  const eventType = event.eventType;

  // VIEWED / UPDATED → sadece heartbeat
  if (
    eventType === 'avi:jira:viewed:issue' ||
    eventType === 'avi:jira:updated:issue'
  ) {
    const userId =
      event.user?.accountId ||
      event.atlassianId ||
      (event.associatedUsers &&
        event.associatedUsers[0]?.accountId);

    if (userId) {
      console.log(
        `💓 Heartbeat from Jira ${eventType} for user ${userId}`
      );
      const stored =
        (await storage.get(`USER_${userId}`)) || { status: 'Available' };
      await storage.set(`USER_${userId}`, {
        ...stored,
        status: stored.status || 'Available',
        lastHeartbeat: new Date().toISOString(),
      });
    } else {
      console.log('⚠️ Jira activity event had no userId / associatedUsers');
    }
    return;
  }

  // Sadece CREATED için auto-assign
  if (eventType !== 'avi:jira:created:issue') {
    console.log(
      `ℹ️ Unsupported eventType for auto-assign: ${eventType}`
    );
    return;
  }

  const issueKey = event.issue.key;
  const projectId = String(event.issue.fields.project.id);
  const projectKey = event.issue.fields.project.key;

  // creator heartbeat
  const creatorId =
    event.user?.accountId ||
    event.atlassianId ||
    (event.associatedUsers &&
      event.associatedUsers[0]?.accountId);

  if (creatorId) {
    const storedCreator =
      (await storage.get(`USER_${creatorId}`)) || {
        status: 'Available',
      };
    await storage.set(`USER_${creatorId}`, {
      ...storedCreator,
      status: storedCreator.status || 'Available',
      lastHeartbeat: new Date().toISOString(),
    });
  }

  const issueRes = await asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}?expand=names`
  );
  if (!issueRes.ok) {
    console.error('Issue fetch error:', issueRes.status, await issueRes.text());
    return;
  }
  const issueData = await issueRes.json();
  const names = issueData.names || {};

  const requestTypeFieldId = CUSTOMER_REQUEST_TYPE_FIELD_ID;

  if (!names[requestTypeFieldId]) {
    console.log(
      `❌ Customer Request Type field ID (${requestTypeFieldId}) names map'te yok.`
    );
    return;
  }

  const requestTypeVal = issueData.fields[requestTypeFieldId];
  if (
    !requestTypeVal ||
    !requestTypeVal.requestType ||
    !requestTypeVal.requestType.id
  ) {
    console.log("⚠️ Bu işin bir Request Type'ı yok.");
    return;
  }

  const currentRequestTypeId = String(requestTypeVal.requestType.id);
  console.log(
    `🔎 Request Type ID: ${currentRequestTypeId}, ProjectId: ${projectId}, ProjectKey: ${projectKey}`
  );

  const rules = (await storage.get('CONFIG_RULES')) || [];
  console.log('🔧 All rules in storage:', rules);

  const rule = rules.find(
    (r) =>
      String(r.projectId) === projectId &&
      String(r.requestTypeId) === currentRequestTypeId
  );

  if (!rule) {
    console.log(
      `❌ Kural yok: RequestType(${currentRequestTypeId}) / Project(${projectId})`
    );
    return;
  }

  console.log(
    `✅ Kural: Grup[${rule.groupId}] | LimitEnabled[${rule.maxIssuesEnabled}] | Limit[${rule.maxIssues}] | Strateji[${rule.strategy}] | Realtime[${rule.realtimeCheck}] | Exception[${
      rule.exceptionEnabled ? 'ON' : 'OFF'
    }]`
  );

  const groupName = rule.groupId || (await getAgentGroupName());
  if (!groupName) {
    console.log('❌ No assignment group (JSM agent group not found)');
    return;
  }

  const groupMembers = await getAllGroupMembers(groupName);
  if (!groupMembers.length) {
    console.log('Grup boş:', groupName);
    return;
  }

  // ===== 1) EXCEPTION CHECK =====
  if (
    rule.exceptionEnabled &&
    rule.exceptionKeyword &&
    Array.isArray(rule.exceptionAssignees) &&
    rule.exceptionAssignees.length > 0
  ) {
    const keyword = rule.exceptionKeyword.toLowerCase();
    const summary = (issueData.fields.summary || '').toLowerCase();

    const descriptionRaw = issueData.fields.description;
    const description =
      typeof descriptionRaw === 'string'
        ? descriptionRaw.toLowerCase()
        : descriptionRaw && descriptionRaw.content
        ? JSON.stringify(descriptionRaw).toLowerCase()
        : '';

    if (summary.includes(keyword) || description.includes(keyword)) {
      console.log(
        `🚨 Exception triggered for keyword "${rule.exceptionKeyword}" on issue ${issueKey}.`
      );

      const excAssignees = rule.exceptionAssignees
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0);

      if (excAssignees.length) {
        const excKey = `EXC_LAST_ASSIGNED_${rule.id}`;
        const lastExc = await storage.get(excKey);

        let nextIdx = 0;
        if (lastExc) {
          const lastIndex = excAssignees.findIndex((id) => id === lastExc);
          if (lastIndex !== -1 && lastIndex < excAssignees.length - 1) {
            nextIdx = lastIndex + 1;
          }
        }

        const excWinner = excAssignees[nextIdx];
        await storage.set(excKey, excWinner);
        console.log(`🎯 Exception round-robin chose: ${excWinner}`);

        const assignExcRes = await asApp().requestJira(
          route`/rest/api/3/issue/${issueKey}/assignee`,
          {
            method: 'PUT',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId: excWinner }),
          }
        );

        if (!assignExcRes.ok) {
          console.error(
            'Exception assignee update error:',
            assignExcRes.status,
            await assignExcRes.text()
          );
        } else {
          console.log(
            `🏆 EXCEPTION SUCCESS! Issue ${issueKey} assigned to ${excWinner} (exception rule).`
          );
        }
        return;
      } else {
        console.log(
          '⚠️ Exception assignee list is empty, ignoring exception and using normal rule.'
        );
      }
    } else {
      console.log(
        `ℹ️ Exception keyword "${rule.exceptionKeyword}" not found in issue ${issueKey}. Using normal rule.`
      );
    }
  }

  // ===== 2) NORMAL RULE LOGIC =====

  const rawCandidates = [];

  for (const member of groupMembers) {
    const accountId = member.accountId;
    if (!accountId) continue;

    const stored = (await storage.get(`USER_${accountId}`)) || {};
    const status = stored.status || 'Available';
    const lastHeartbeat = stored.lastHeartbeat || null;

    rawCandidates.push({
      accountId,
      displayName: member.displayName || 'Agent',
      status,
      lastHeartbeat,
    });
  }

  if (!rawCandidates.length) {
    console.log('⚠️ No raw candidates from group.');
    return;
  }

  const strategy = rule.strategy || 'RoundRobinAvailable';
  const enforceRealtime = !!rule.realtimeCheck;

  let baseCandidates = rawCandidates.filter((c) => {
    if (strategy === 'RoundRobinAvailable') {
      if (c.status !== 'Available') return false;
    } else if (strategy === 'RoundRobinAvailableAway') {
      if (!(c.status === 'Available' || c.status === 'Away')) return false;
    }

    if (enforceRealtime) {
      if (!c.lastHeartbeat) return false;
      const diffMin =
        (Date.now() - new Date(c.lastHeartbeat).getTime()) / 60000;
      if (diffMin > 10) return false;
    }

    return true;
  });

  if (!baseCandidates.length) {
    console.log(
      '⚠️ Strategy + realtime sonrası uygun base candidate yok, tüm group üzerinden devam edilecek.'
    );
    baseCandidates = rawCandidates;
  }

  let finalCandidates = [...baseCandidates];

  if (rule.maxIssuesEnabled && rule.maxIssues && parseInt(rule.maxIssues, 10) > 0) {
    const limit = parseInt(rule.maxIssues, 10);
    const filtered = [];

    for (const c of baseCandidates) {
      const total = await countIssuesForUser(projectKey, c.accountId);
      console.log(
        `📊 MaxIssue: user=${c.displayName} (${c.accountId}) total=${total}, limit=${limit}`
      );

      if (total >= limit) {
        console.log(
          `⛔ ${c.displayName} dolu (${total}/${limit}), maxIssue nedeniyle hariç.`
        );
      } else {
        filtered.push(c);
      }
    }

    if (!filtered.length) {
      console.log(
        '⚠️ Tüm kullanıcılar maxIssue limitinde veya üzerinde, maxIssue kuralı yok sayılacak.'
      );
      finalCandidates = baseCandidates;
    } else {
      finalCandidates = filtered;
    }
  }

  if (!finalCandidates.length) {
    console.log(
      '⚠️ Hiç uygun aday bulunamadı (tüm filtreler sonrası).'
    );
    return;
  }

  finalCandidates.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  let winner = null;
  const lastAssignedKey = `LAST_ASSIGNED_${rule.id}`;
  const lastAssignedId = await storage.get(lastAssignedKey);

  let nextIndex = 0;
  if (lastAssignedId) {
    const lastIndex = finalCandidates.findIndex(
      (c) => c.accountId === lastAssignedId
    );
    if (lastIndex !== -1 && lastIndex < finalCandidates.length - 1) {
      nextIndex = lastIndex + 1;
    }
  }
  winner = finalCandidates[nextIndex].accountId;
  await storage.set(lastAssignedKey, winner);
  console.log(`🔄 Round Robin: ${winner} seçildi.`);

  const assignRes = await asApp().requestJira(
    route`/rest/api/3/issue/${issueKey}/assignee`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId: winner }),
    }
  );

  if (!assignRes.ok) {
    console.error(
      'Assignee update error:',
      assignRes.status,
      await assignRes.text()
    );
  } else {
    console.log(`🏆 BAŞARILI! İş ${winner} kullanıcısına atandı.`);
  }
};

async function countIssuesForUser(projectKey, accountId) {
  const jql = `project = "${projectKey}" AND assignee = "${accountId}" AND (resolution is EMPTY OR resolution = Unresolved)`;
  console.log(`🔍 MaxIssue JQL for ${accountId}: ${jql}`);

  const approxBody = JSON.stringify({ jql });

  // 1) approximate-count
  try {
    const approxRes = await asApp().requestJira(
      route`/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: approxBody,
      }
    );

    if (approxRes.ok) {
      const approxData = await approxRes.json();
      const approxTotal = approxData.count || 0;
      console.log(
        `📊 MaxIssue approximate-count for ${accountId}: ${approxTotal}`
      );

      if (approxTotal > 0) {
        return approxTotal;
      }
    } else {
      console.error(
        `Approximate-count error for user ${accountId}:`,
        approxRes.status,
        await approxRes.text()
      );
    }
  } catch (e) {
    console.error('Approximate-count exception:', e);
  }

  // 2) POST /search/jql
  try {
    const bodyObj = {
      jql,
      startAt: 0,
      maxResults: 200,
      fields: ['key'],
      fieldsByKeys: false,
    };

    const res = await asApp().requestJira(
      route`/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyObj),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const issues = data.issues || [];
      const counted = issues.length;
      console.log(
        `📊 MaxIssue POST /search/jql count for ${accountId}: ${counted}`
      );
      if (counted > 0) {
        return counted;
      }
    } else {
      console.error(
        `POST /search/jql error for user ${accountId}:`,
        res.status,
        await res.text()
      );
    }
  } catch (e) {
    console.error('POST /search/jql exception:', e);
  }

  // 3) GET /search/jql
  try {
    const jqlEncoded = encodeURIComponent(jql);
    const url = route`/rest/api/3/search/jql?jql=${jqlEncoded}&maxResults=200&fields=key`;

    const res = await asApp().requestJira(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(
        `GET /search/jql error for user ${accountId}:`,
        res.status,
        await res.text()
      );
      return 0;
    }

    const data = await res.json();
    const issues = data.issues || [];
    const counted = issues.length;
    console.log(
        `📊 MaxIssue GET /search/jql count for ${accountId}: ${counted}`
    );
    return counted;
  } catch (e) {
    console.error('GET /search/jql exception:', e);
    return 0;
  }
}

export const handler = resolver.getDefinitions();