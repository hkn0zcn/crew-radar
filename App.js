import React, { useEffect, useState, useMemo } from 'react';
import { invoke, view } from '@forge/bridge';

// THEME
const theme = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  primary: '#0052CC',
  primaryDark: '#0747A6',
  danger: '#DE350B',
  success: '#36B37E',
  text: '#172B4D',
  subText: '#6B778C',
  border: '#DFE1E6',
  radius: '8px',
  shadow: '0 4px 20px rgba(0,0,0,0.08)',
};

const styles = {
  container: {
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    color: theme.text,
    maxWidth: '900px',
    margin: '0 auto',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: theme.text,
    marginBottom: '5px',
  },
  headerSub: {
    fontSize: '14px',
    color: theme.subText,
    marginBottom: '30px',
  },
  card: {
    background: theme.card,
    borderRadius: theme.radius,
    padding: '24px',
    marginBottom: '24px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: theme.subText,
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    fontSize: '13px',
    marginBottom: '10px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border 0.2s',
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.border}`,
    fontSize: '13px',
    marginBottom: '10px',
    background: '#fff',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  btn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    background: theme.primary,
    color: '#fff',
    boxShadow: '0 4px 10px rgba(0,82,204,0.3)',
  },
  btnGhost: {
    background: 'transparent',
    color: theme.subText,
    border: `1px solid ${theme.border}`,
  },
  btnDangerGhost: {
    background: 'transparent',
    color: theme.danger,
    border: `1px solid ${theme.border}`,
    marginLeft: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 15px',
    fontSize: '12px',
    color: theme.subText,
    fontWeight: '600',
    cursor: 'pointer',
  },
  tr: {
    background: '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
    transition: 'transform 0.1s',
  },
  td: {
    padding: '16px 15px',
    fontSize: '14px',
    borderTop: `1px solid ${theme.border}`,
    borderBottom: `1px solid ${theme.border}`,
  },
};

// ROOT APP
function App() {
  const [context, setContext] = useState(null);
  useEffect(() => {
    view.getContext().then(setContext);
  }, []);
  if (!context) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
        Loading System...
      </div>
    );
  }
  const moduleKey = context.moduleKey;
  if (moduleKey === 'crewradar-admin') return <AdminPanel />;
  if (moduleKey === 'crewradar-dashboard' || moduleKey === 'crewradar-panel') {
    return <UserDashboard context={context} isPanel={moduleKey === 'crewradar-panel'} />;
  }
  return <div>Unknown Module</div>;
}

// -----------------------------------------------------------
// ADMIN PANEL
// -----------------------------------------------------------
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('rules');
  return (
    <div style={styles.container}>
      {/* LOGOSUZ HEADER BLOĞU – sadece gradient kare */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background:
              'radial-gradient(circle at 20% 20%, #FF7452, transparent 55%), radial-gradient(circle at 80% 80%, #36B37E, transparent 55%)',
            boxShadow: '0 8px 18px rgba(9,30,66,0.35)',
          }}
        />
        <div>
          <div style={styles.headerTitle}>CrewRadar Configuration</div>
          <div style={styles.headerSub}>
            Auto-assignment rules, exceptions, Microsoft Teams integration & live agent
            presence.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginBottom: '20px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom:
              activeTab === 'rules'
                ? `3px solid ${theme.primary}`
                : '3px solid transparent',
            fontWeight: activeTab === 'rules' ? 700 : 500,
            color: activeTab === 'rules' ? theme.primary : theme.subText,
            marginRight: '16px',
          }}
        >
          Assignment Rules
        </div>
        <div
          onClick={() => setActiveTab('agents')}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom:
              activeTab === 'agents'
                ? `3px solid ${theme.primary}`
                : '3px solid transparent',
            fontWeight: activeTab === 'agents' ? 700 : 500,
            color: activeTab === 'agents' ? theme.primary : theme.subText,
          }}
        >
          Live Agents
        </div>
      </div>

      {activeTab === 'rules' ? <RulesTab /> : <LiveAgentsTab />}
    </div>
  );
};

// -----------------------------------------------------------
// RULES TAB – TEAMS CARD + 2 COLUMN ASSIGNMENT FORM + TABLO
// -----------------------------------------------------------
const RulesTab = () => {
  const [projects, setProjects] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selProject, setSelProject] = useState('');
  const [selReqType, setSelReqType] = useState('');
  const [selGroup, setSelGroup] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [strategy, setStrategy] = useState('RoundRobinAvailable');
  const [realtime, setRealtime] = useState(false);

  const [maxIssuesEnabled, setMaxIssuesEnabled] = useState(false);
  const [maxIssues, setMaxIssues] = useState(5);

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rtError, setRtError] = useState('');
  const [initError, setInitError] = useState('');

  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Exception (new rule)
  const [exceptionEnabled, setExceptionEnabled] = useState(false);
  const [exceptionKeyword, setExceptionKeyword] = useState('');
  const [exceptionCandidates, setExceptionCandidates] = useState([]);
  const [exceptionSelectedIds, setExceptionSelectedIds] = useState([]);

  // MS Teams config (admin)
  const [teamsCfg, setTeamsCfg] = useState({
    enabled: false,
    tenantId: '',
    clientId: '',
    clientSecret: '',
  });
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [teamsMessage, setTeamsMessage] = useState('');
  const [teamsError, setTeamsError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const projRes = await invoke('getJSMProjects').catch(() => []);
        const grpRes = await invoke('getGroups').catch(() => []);
        const cfgRes = await invoke('getConfig').catch(() => ({ rules: [] }));
        const teamsRes = await invoke('getTeamsConfig').catch(() => null);

        setProjects(Array.isArray(projRes) ? projRes : []);
        setGroups(Array.isArray(grpRes) ? grpRes : []);
        setRules(cfgRes && Array.isArray(cfgRes.rules) ? cfgRes.rules : []);

        if (teamsRes) {
          setTeamsCfg({
            enabled: !!teamsRes.enabled,
            tenantId: teamsRes.tenantId || '',
            clientId: teamsRes.clientId || '',
            clientSecret: '',
          });
        }

        if (!projRes.length || !grpRes.length) {
          setInitError(
            'JSM projects or Jira groups could not be loaded, but UI will still work. Check Forge logs if needed.'
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setRequestTypes([]);
    setSelReqType('');
    setRtError('');
    if (!selProject) return;

    invoke('getRequestTypes', { projectId: selProject })
      .then((rts) => {
        console.log('Frontend requestTypes for project', selProject, rts);
        if (!rts || !rts.length) {
          setRtError('Bu proje için portal request type bulunamadı veya erişilemiyor.');
          setRequestTypes([]);
        } else {
          setRequestTypes(rts);
        }
      })
      .catch((e) => {
        console.error('getRequestTypes error', e);
        setRtError('Request type listesi alınırken hata oluştu.');
        setRequestTypes([]);
      });
  }, [selProject]);

  // Group değişince exception için group members getir
  useEffect(() => {
    const loadMembers = async () => {
      setExceptionCandidates([]);
      setExceptionSelectedIds([]);
      if (!selGroup) return;
      try {
        const members = await invoke('getGroupMembers', { groupName: selGroup }).catch(
          () => []
        );
        setExceptionCandidates(Array.isArray(members) ? members : []);
      } catch (e) {
        console.error('getGroupMembers frontend error:', e);
      }
    };
    loadMembers();
  }, [selGroup]);

  const handleToggleExceptionMember = (accountId) => {
    setExceptionSelectedIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSaveNew = () => {
    if (!selProject || !selReqType || !selGroup) {
      alert('Please fill all fields (Project, Request Type, Group).');
      return;
    }
    const exists = rules.find(
      (r) =>
        String(r.projectId) === String(selProject) &&
        String(r.requestTypeId) === String(selReqType)
    );
    if (exists) {
      alert('A rule for this Project & Request Type already exists! Edit the existing one.');
      return;
    }

    if (exceptionEnabled) {
      if (!exceptionKeyword.trim()) {
        alert('Exception keyword is required when exception is enabled.');
        return;
      }
      if (!exceptionSelectedIds.length) {
        alert('Please select at least one exception assignee when exception is enabled.');
        return;
      }
    }

    const projName =
      projects.find((p) => String(p.id) === String(selProject))?.name || selProject;
    const reqName =
      requestTypes.find((r) => String(r.id) === String(selReqType))?.name || selReqType;

    const newRule = {
      id: Date.now(),
      projectId: String(selProject),
      projectName: projName,
      requestTypeId: String(selReqType),
      requestTypeName: reqName,
      groupId: selGroup,
      strategy,
      realtimeCheck: realtime,
      maxIssuesEnabled,
      maxIssues: maxIssuesEnabled ? parseInt(maxIssues || '0', 10) : null,
      exceptionEnabled,
      exceptionKeyword: exceptionEnabled ? exceptionKeyword.trim() : '',
      exceptionAssignees: exceptionEnabled ? exceptionSelectedIds : [],
    };

    const newRules = [...rules, newRule];
    setRules(newRules);
    invoke('saveConfig', { rules: newRules });
    resetNewForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    const newRules = rules.filter((r) => r.id !== id);
    setRules(newRules);
    invoke('saveConfig', { rules: newRules });
  };

  const resetNewForm = () => {
    setSelProject('');
    setSelReqType('');
    setSelGroup('');
    setSearchGroup('');
    setStrategy('RoundRobinAvailable');
    setRealtime(false);
    setMaxIssuesEnabled(false);
    setMaxIssues(5);
    setRequestTypes([]);
    setRtError('');
    setExceptionEnabled(false);
    setExceptionKeyword('');
    setExceptionCandidates([]);
    setExceptionSelectedIds([]);
  };

  useEffect(() => {
    if (editingRule) {
      setEditForm({
        ...editingRule,
        projectId: String(editingRule.projectId),
        requestTypeId: String(editingRule.requestTypeId),
        maxIssuesEnabled: !!editingRule.maxIssuesEnabled,
        maxIssues:
          editingRule.maxIssuesEnabled && editingRule.maxIssues
            ? editingRule.maxIssues
            : 5,
        exceptionEnabled: !!editingRule.exceptionEnabled,
        exceptionKeyword: editingRule.exceptionKeyword || '',
        exceptionAssignees: Array.isArray(editingRule.exceptionAssignees)
          ? editingRule.exceptionAssignees
          : [],
      });
    } else {
      setEditForm(null);
    }
  }, [editingRule]);

  const handleSaveEdit = () => {
    if (!editForm.projectId || !editForm.requestTypeId || !editForm.groupId) {
      alert('Please fill all fields in Edit Rule.');
      return;
    }
    const exists = rules.find(
      (r) =>
        String(r.projectId) === String(editForm.projectId) &&
        String(r.requestTypeId) === String(editForm.requestTypeId) &&
        r.id !== editForm.id
    );
    if (exists) {
      alert('Another rule with same Project & Request Type exists!');
      return;
    }

    if (editForm.exceptionEnabled) {
      if (!editForm.exceptionKeyword.trim()) {
        alert('Exception keyword is required when exception is enabled.');
        return;
      }
      if (!editForm.exceptionAssignees || !editForm.exceptionAssignees.length) {
        alert('Please select at least one exception assignee when exception is enabled.');
        return;
      }
    }

    const cleaned = {
      ...editForm,
      exceptionKeyword: editForm.exceptionEnabled
        ? (editForm.exceptionKeyword || '').trim()
        : '',
      exceptionAssignees:
        editForm.exceptionEnabled && Array.isArray(editForm.exceptionAssignees)
          ? editForm.exceptionAssignees.filter((s) => s && s.trim().length > 0)
          : [],
    };

    const newRules = rules.map((r) => (r.id === editForm.id ? cleaned : r));
    setRules(newRules);
    invoke('saveConfig', { rules: newRules });
    setEditingRule(null);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchGroup.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
        Loading Configuration...
      </div>
    );
  }

  return (
    <>
      {initError && (
        <div
          style={{
            marginBottom: '16px',
            padding: '8px 12px',
            borderRadius: '4px',
            background: '#FFEBE6',
            color: '#BF2600',
            fontSize: '12px',
          }}
        >
          {initError}
        </div>
      )}

      {/* TEAMS CONFIG CARD */}
      <div style={styles.card}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '10px',
            color: theme.primary,
          }}
        >
          Microsoft Teams Integration
        </div>
        <div
          style={{
            fontSize: '12px',
            color: theme.subText,
            marginBottom: '10px',
          }}
        >
          Configure a Microsoft Entra ID (Azure AD) app with{' '}
          <code>Presence.Read.All</code> and <code>User.Read.All</code> application
          permissions. CrewRadar will use your users&apos; Jira email addresses or
          display names to map to Microsoft 365 users.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.5fr',
            gap: '20px',
            marginBottom: '10px',
          }}
        >
          <div>
            <label style={styles.label}>Enable Teams presence sync</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <input
                id="teamsEnabled"
                type="checkbox"
                checked={teamsCfg.enabled}
                onChange={(e) =>
                  setTeamsCfg({ ...teamsCfg, enabled: e.target.checked })
                }
                style={{
                  width: '18px',
                  height: '18px',
                  marginRight: '8px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '13px', color: theme.text }}>
                Allow users to sync their presence with Microsoft Teams
              </span>
            </div>
          </div>
          <div>
            <label style={styles.label}>Tenant ID</label>
            <input
              style={styles.input}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={teamsCfg.tenantId}
              onChange={(e) =>
                setTeamsCfg({ ...teamsCfg, tenantId: e.target.value })
              }
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
          }}
        >
          <div>
            <label style={styles.label}>Client ID</label>
            <input
              style={styles.input}
              placeholder="Application (client) ID"
              value={teamsCfg.clientId}
              onChange={(e) =>
                setTeamsCfg({ ...teamsCfg, clientId: e.target.value })
              }
            />
          </div>
          <div>
            <label style={styles.label}>Client Secret</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••••••••••••"
              value={teamsCfg.clientSecret}
              onChange={(e) =>
                setTeamsCfg({ ...teamsCfg, clientSecret: e.target.value })
              }
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
              padding: '8px 18px',
              fontSize: '13px',
            }}
            onClick={async () => {
              setTeamsSaving(true);
              setTeamsMessage('');
              setTeamsError('');
              try {
                await invoke('saveTeamsConfig', {
                  enabled: teamsCfg.enabled,
                  tenantId: teamsCfg.tenantId,
                  clientId: teamsCfg.clientId,
                  clientSecret: teamsCfg.clientSecret,
                });
                const res = await invoke('testTeamsConnection', {});
                if (res && res.success) {
                  setTeamsMessage('OK: Successfully obtained Graph token.');
                } else {
                  setTeamsError(
                    (res && res.message) ||
                      'FAILED: Could not obtain Graph token. Check Azure AD configuration.'
                  );
                }
              } catch (e) {
                console.error('saveTeamsConfig/testTeamsConnection error', e);
                setTeamsError(
                  'FAILED: Error while saving or testing Teams configuration. Check Forge logs.'
                );
              } finally {
                setTeamsSaving(false);
              }
            }}
            disabled={teamsSaving}
          >
            {teamsSaving ? 'Saving & Testing...' : 'Save Teams configuration'}
          </button>
          <a
            href="https://learn.microsoft.com/en-us/graph/api/presence-get"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: theme.primary }}
          >
            How to configure Graph presence API
          </a>
        </div>
        {teamsMessage && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#006644',
            }}
          >
            {teamsMessage}
          </div>
        )}
        {teamsError && (
          <div
            style={{
              marginTop: '4px',
              fontSize: '11px',
              color: '#BF2600',
            }}
          >
            {teamsError}
          </div>
        )}
      </div>

      {/* ASSIGNMENT RULE FORM – 2 COLUMN HALİ */}
      <div style={styles.card}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '12px',
            color: theme.primaryDark,
          }}
        >
          Assignment Rules
        </div>

        {/* ÜSTTE 2 KOLON: Sol (Project, Request Type), Sağ (Group, Strategy, Max, Realtime) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1.1fr',
            gap: '18px',
            marginBottom: '10px',
          }}
        >
          {/* SOL KOLON */}
          <div>
            <label style={styles.label}>JSM Project</label>
            <select
              style={styles.select}
              value={selProject}
              onChange={(e) => setSelProject(e.target.value)}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>

            <label style={styles.label}>Request Type</label>
            <select
              style={styles.select}
              value={selReqType}
              onChange={(e) => setSelReqType(e.target.value)}
              disabled={!selProject}
            >
              <option value="">Select a request type...</option>
              {requestTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            {rtError && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#BF2600',
                  marginBottom: '4px',
                }}
              >
                {rtError}
              </div>
            )}
          </div>

          {/* SAĞ KOLON */}
          <div>
            <label style={styles.label}>Assignee Group</label>
            <input
              style={styles.input}
              placeholder="Type to filter groups..."
              value={searchGroup}
              onChange={(e) => setSearchGroup(e.target.value)}
            />
            <select
              style={styles.select}
              value={selGroup}
              onChange={(e) => setSelGroup(e.target.value)}
            >
              <option value="">Select a group...</option>
              {filteredGroups.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: '10px',
                marginTop: '2px',
              }}
            >
              <div>
                <label style={styles.label}>Strategy</label>
                <select
                  style={styles.select}
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="RoundRobinAvailable">
                    Round Robin (Available only)
                  </option>
                  <option value="RoundRobinAvailableAway">
                    Round Robin (Available + Away)
                  </option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Max Issues</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <input
                    id="maxIssuesEnabled"
                    type="checkbox"
                    checked={maxIssuesEnabled}
                    onChange={(e) => setMaxIssuesEnabled(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '6px',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="maxIssuesEnabled"
                    style={{
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: theme.text,
                    }}
                  >
                    Enable limit
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  style={{ ...styles.input, marginBottom: 0 }}
                  value={maxIssues}
                  disabled={!maxIssuesEnabled}
                  onChange={(e) => setMaxIssues(parseInt(e.target.value || '0', 10))}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                id="realtimeCheck"
                type="checkbox"
                checked={realtime}
                onChange={(e) => setRealtime(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginRight: '8px',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="realtimeCheck"
                style={{ fontSize: '12px', color: theme.text }}
              >
                User must be online in the last 10 min.
              </label>
            </div>
          </div>
        </div>

        {/* EXCEPTION – TEK SATIR BLOK */}
        <div
          style={{
            marginTop: '10px',
            paddingTop: '12px',
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <label style={styles.label}>Exception (Keyword-based)</label>
          <div
            style={{
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '8px',
              border: `1px dashed ${theme.border}`,
              background: '#F4F5F7',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <input
                id="exceptionEnabled"
                type="checkbox"
                checked={exceptionEnabled}
                onChange={(e) => setExceptionEnabled(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginRight: '8px',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="exceptionEnabled"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.text,
                  cursor: 'pointer',
                }}
              >
                Define exception (summary/description keyword)
              </label>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.1fr',
                gap: '10px',
                marginBottom: '6px',
              }}
            >
              <div>
                <input
                  style={styles.input}
                  placeholder='Keyword, e.g. "eba"'
                  disabled={!exceptionEnabled}
                  value={exceptionKeyword}
                  onChange={(e) => setExceptionKeyword(e.target.value)}
                />
                <div
                  style={{
                    fontSize: '10px',
                    color: theme.subText,
                  }}
                >
                  If keyword is found, assign only to selected exception assignees.
                </div>
              </div>
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  padding: '4px',
                  background: '#FFFFFF',
                }}
              >
                {exceptionCandidates.length === 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.subText,
                    }}
                  >
                    Select an assignee group to load members.
                  </div>
                )}
                {exceptionCandidates.map((m) => {
                  const selected = exceptionSelectedIds.includes(m.accountId);
                  return (
                    <div
                      key={m.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 4px',
                        marginBottom: '3px',
                        borderRadius: '6px',
                        background: selected ? '#E3FCEF' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (!exceptionEnabled) return;
                        handleToggleExceptionMember(m.accountId);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        style={{ marginRight: '6px' }}
                      />
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#EBECF0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: theme.text,
                          marginRight: '6px',
                        }}
                      >
                        {(m.displayName || 'U').charAt(0)}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: theme.text,
                        }}
                      >
                        {m.displayName}
                        <div
                          style={{
                            fontSize: '9px',
                            color: theme.subText,
                          }}
                        >
                          {m.accountId}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {exceptionSelectedIds.length > 0 && (
              <div
                style={{
                  marginTop: '2px',
                  fontSize: '10px',
                  color: theme.subText,
                }}
              >
                Selected exception assignees: {exceptionSelectedIds.length}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            style={{
              ...styles.btn,
              ...styles.btnGhost,
            }}
            onClick={resetNewForm}
          >
            Reset
          </button>
          <button
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
            }}
            onClick={handleSaveNew}
          >
            Add rule
          </button>
        </div>
      </div>

      {/* RULES LIST TABLOSU – alt tarafta satır satır */}
      <div style={styles.card}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '12px',
            color: theme.primaryDark,
          }}
        >
          Existing Rules
        </div>
        {rules.length === 0 ? (
          <div style={{ fontSize: '13px', color: theme.subText }}>
            No rules defined yet. Create your first auto-assignment rule above.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>Request Type</th>
                <th style={styles.th}>Group</th>
                <th style={styles.th}>Strategy</th>
                <th style={styles.th}>Realtime</th>
                <th style={styles.th}>Max Issues</th>
                <th style={styles.th}>Exception</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{r.projectName}</td>
                  <td style={styles.td}>{r.requestTypeName}</td>
                  <td style={styles.td}>{r.groupId}</td>
                  <td style={styles.td}>{r.strategy}</td>
                  <td style={styles.td}>{r.realtimeCheck ? 'Yes' : 'No'}</td>
                  <td style={styles.td}>
                    {r.maxIssuesEnabled && r.maxIssues != null ? r.maxIssues : '-'}
                  </td>
                  <td style={styles.td}>
                    {r.exceptionEnabled
                      ? `ON: "${r.exceptionKeyword}" (${(r.exceptionAssignees || []).length} user)`
                      : 'OFF'}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{
                        ...styles.btn,
                        ...styles.btnGhost,
                        padding: '4px 10px',
                        fontSize: '12px',
                        marginRight: '6px',
                      }}
                      onClick={() => setEditingRule(r)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        ...styles.btn,
                        ...styles.btnDangerGhost,
                        padding: '4px 10px',
                        fontSize: '12px',
                      }}
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingRule && editForm && (
        <EditRuleModal
          editForm={editForm}
          setEditForm={setEditForm}
          rules={rules}
          setRules={setRules}
          setEditingRule={setEditingRule}
        />
      )}
    </>
  );
};

// -----------------------------------------------------------
// EDIT RULE MODAL – aynı mantık, PNG yok
// -----------------------------------------------------------
const EditRuleModal = ({ editForm, setEditForm, rules, setRules, setEditingRule }) => {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    const loadMembers = async () => {
      if (!editForm.groupId) {
        setMembers([]);
        return;
      }
      try {
        const res = await invoke('getGroupMembers', {
          groupName: editForm.groupId,
        }).catch(() => []);
        setMembers(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error('getGroupMembers in edit modal error:', e);
        setMembers([]);
      }
    };
    loadMembers();
  }, [editForm.groupId]);

  const toggleExcMember = (accountId) => {
    const list = editForm.exceptionAssignees || [];
    const updated = list.includes(accountId)
      ? list.filter((id) => id !== accountId)
      : [...list, accountId];
    setEditForm({ ...editForm, exceptionAssignees: updated });
  };

  const handleSave = () => {
    if (!editForm.projectId || !editForm.requestTypeId || !editForm.groupId) {
      alert('Please fill all fields in Edit Rule.');
      return;
    }
    const exists = rules.find(
      (r) =>
        String(r.projectId) === String(editForm.projectId) &&
        String(r.requestTypeId) === String(editForm.requestTypeId) &&
        r.id !== editForm.id
    );
    if (exists) {
      alert('Another rule with same Project & Request Type exists!');
      return;
    }
    if (editForm.exceptionEnabled) {
      if (!editForm.exceptionKeyword.trim()) {
        alert('Exception keyword is required when exception is enabled.');
        return;
      }
      if (!editForm.exceptionAssignees || !editForm.exceptionAssignees.length) {
        alert('Please select at least one exception assignee when exception is enabled.');
        return;
      }
    }

    const cleaned = {
      ...editForm,
      exceptionKeyword: editForm.exceptionEnabled
        ? (editForm.exceptionKeyword || '').trim()
        : '',
      exceptionAssignees:
        editForm.exceptionEnabled && Array.isArray(editForm.exceptionAssignees)
          ? editForm.exceptionAssignees.filter((s) => s && s.trim().length > 0)
          : [],
    };

    const newRules = rules.map((r) => (r.id === editForm.id ? cleaned : r));
    setRules(newRules);
    invoke('saveConfig', { rules: newRules });
    setEditingRule(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          width: '640px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '16px',
            color: theme.primary,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>✏️ Edit Rule</span>
          <button
            style={{
              ...styles.btn,
              ...styles.btnGhost,
              padding: '4px 10px',
              fontSize: '12px',
            }}
            onClick={() => setEditingRule(null)}
          >
            Close
          </button>
        </div>

        <label style={styles.label}>JSM Project</label>
        <input style={styles.input} disabled value={editForm.projectName} />

        <label style={styles.label}>Request Type</label>
        <input style={styles.input} disabled value={editForm.requestTypeName} />

        <label style={styles.label}>Assignee Group</label>
        <input
          style={styles.input}
          value={editForm.groupId}
          onChange={(e) =>
            setEditForm({ ...editForm, groupId: e.target.value })
          }
        />

        <label style={styles.label}>Strategy</label>
        <select
          style={styles.select}
          value={editForm.strategy || 'RoundRobinAvailable'}
          onChange={(e) =>
            setEditForm({ ...editForm, strategy: e.target.value })
          }
        >
          <option value="RoundRobinAvailable">Round Robin (Available only)</option>
          <option value="RoundRobinAvailableAway">
            Round Robin (Available + Away)
          </option>
        </select>

        <label style={styles.label}>Max Issues per Agent</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <input
            id="editMaxIssuesEnabled"
            type="checkbox"
            checked={!!editForm.maxIssuesEnabled}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                maxIssuesEnabled: e.target.checked,
              })
            }
            style={{
              width: '16px',
              height: '16px',
              marginRight: '8px',
              cursor: 'pointer',
            }}
          />
          <label
            htmlFor="editMaxIssuesEnabled"
            style={{
              fontSize: '13px',
              cursor: 'pointer',
              color: theme.text,
            }}
          >
            Enable workload limit
          </label>
        </div>
        <input
          type="number"
          min="0"
          style={{ ...styles.input, marginBottom: 0 }}
          value={editForm.maxIssues}
          disabled={!editForm.maxIssuesEnabled}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              maxIssues: parseInt(e.target.value || '0', 10),
            })
          }
        />

        <label style={styles.label}>Enforce Real-time Check</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <input
            id="editRealtime"
            type="checkbox"
            checked={!!editForm.realtimeCheck}
            onChange={(e) =>
              setEditForm({ ...editForm, realtimeCheck: e.target.checked })
            }
            style={{
              width: '18px',
              height: '18px',
              marginRight: '10px',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '13px', color: theme.text }}>
            User must be online in the last 10 min.
          </span>
        </div>

        <label style={styles.label}>Exception (Keyword-based)</label>
        <div
          style={{
            marginBottom: '10px',
            padding: '10px',
            borderRadius: '8px',
            border: `1px dashed ${theme.border}`,
            background: '#F4F5F7',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <input
              id="editExceptionEnabled"
              type="checkbox"
              checked={!!editForm.exceptionEnabled}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  exceptionEnabled: e.target.checked,
                })
              }
              style={{
                width: '18px',
                height: '18px',
                marginRight: '8px',
                cursor: 'pointer',
              }}
            />
            <label
              htmlFor="editExceptionEnabled"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              Define exception (summary/description keyword)
            </label>
          </div>
          <input
            style={styles.input}
            placeholder='Keyword or phrase, e.g. "eba"'
            disabled={!editForm.exceptionEnabled}
            value={editForm.exceptionKeyword}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                exceptionKeyword: e.target.value,
              })
            }
          />
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              padding: '6px',
              background: '#FFFFFF',
            }}
          >
            {members.length === 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: theme.subText,
                }}
              >
                Group members could not be loaded or group is empty.
              </div>
            )}
            {members.map((m) => {
              const selected =
                Array.isArray(editForm.exceptionAssignees) &&
                editForm.exceptionAssignees.includes(m.accountId);
              return (
                <div
                  key={m.accountId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 6px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    background: selected ? '#E3FCEF' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (!editForm.exceptionEnabled) return;
                    toggleExcMember(m.accountId);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    style={{ marginRight: '6px' }}
                  />
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#EBECF0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: theme.text,
                      marginRight: '6px',
                    }}
                  >
                    {(m.displayName || 'U').charAt(0)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: theme.text,
                    }}
                  >
                    {m.displayName}
                    <div
                      style={{
                        fontSize: '10px',
                        color: theme.subText,
                      }}
                    >
                      {m.accountId}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {Array.isArray(editForm.exceptionAssignees) &&
            editForm.exceptionAssignees.length > 0 && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '10px',
                  color: theme.subText,
                }}
              >
                Selected exception assignees: {editForm.exceptionAssignees.length}
              </div>
            )}
        </div>

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            style={{
              ...styles.btn,
              ...styles.btnGhost,
            }}
            onClick={() => setEditingRule(null)}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.btn,
              ...styles.btnPrimary,
            }}
            onClick={handleSave}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------
// LIVE AGENTS TAB – değişmedi (PNG yok)
// -----------------------------------------------------------
const LiveAgentsTab = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await invoke('getAllAgentStatuses');
      setAgents(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('getAllAgentStatuses frontend error:', e);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const filteredAndSortedAgents = useMemo(() => {
    let list = [...agents];
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.displayName || '').toLowerCase().includes(q) ||
          (a.accountId || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'name') {
        const nA = (a.displayName || '').toLowerCase();
        const nB = (b.displayName || '').toLowerCase();
        if (nA < nB) return sortDir === 'asc' ? -1 : 1;
        if (nA > nB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortBy === 'presence') {
        const rank = (s) => {
          if (!s) return 2;
          const t = s.toLowerCase();
          if (t === 'available') return 0;
          if (t.includes('busy') || t.includes('meeting')) return 1;
          return 2;
        };
        const rA = rank(a.status);
        const rB = rank(b.status);
        if (rA < rB) return sortDir === 'asc' ? -1 : 1;
        if (rA > rB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortBy === 'computer') {
        const rnk = (online) => (online ? 0 : 1);
        const cA = rnk(a.isOnline);
        const cB = rnk(b.isOnline);
        if (cA < cB) return sortDir === 'asc' ? -1 : 1;
        if (cA > cB) return sortDir === 'asc' ? 1 : -1;
        const tA = a.lastHeartbeat ? new Date(a.lastHeartbeat).getTime() : 0;
        const tB = b.lastHeartbeat ? new Date(b.lastHeartbeat).getTime() : 0;
        if (tA > tB) return sortDir === 'asc' ? -1 : 1;
        if (tA < tB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }

      return 0;
    });

    return list;
  }, [agents, searchText, sortBy, sortDir]);

  const total = filteredAndSortedAgents.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount - 1);

  const pageAgents = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredAndSortedAgents.slice(start, end);
  }, [filteredAndSortedAgents, currentPage, pageSize]);

  return (
    <div style={styles.card}>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          marginBottom: '16px',
          color: theme.primary,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Live JSM Agents</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: theme.subText }}>
            Online in last 10 min: {agents.filter((a) => a.isOnline).length} /{' '}
            {agents.length}
          </span>
          <button
            style={{
              ...styles.btn,
              ...styles.btnGhost,
              padding: '4px 10px',
              fontSize: '11px',
            }}
            onClick={loadAgents}
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '12px', color: theme.subText }}>
          Rows per page:{' '}
          <select
            style={{
              ...styles.select,
              width: '80px',
              display: 'inline-block',
              marginBottom: 0,
            }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <input
          style={{
            ...styles.input,
            maxWidth: '260px',
            marginBottom: 0,
          }}
          placeholder="Search by name or accountId..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            color: theme.subText,
            padding: '20px',
          }}
        >
          Loading...
        </div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => toggleSort('name')}>
                  Agent{' '}
                  {sortBy === 'name'
                    ? sortDir === 'asc'
                      ? '▲'
                      : '▼'
                    : ''}
                </th>
                <th style={styles.th} onClick={() => toggleSort('presence')}>
                  Presence{' '}
                  {sortBy === 'presence'
                    ? sortDir === 'asc'
                      ? '▲'
                      : '▼'
                    : ''}
                </th>
                <th style={styles.th} onClick={() => toggleSort('computer')}>
                  Computer{' '}
                  {sortBy === 'computer'
                    ? sortDir === 'asc'
                      ? '▲'
                      : '▼'
                    : ''}
                </th>
                <th style={styles.th}>Agent Group</th>
              </tr>
            </thead>
            <tbody>
              {pageAgents.map((a) => (
                <tr key={a.accountId} style={styles.tr}>
                  <td
                    style={{
                      ...styles.td,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#EBECF0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: theme.text,
                      }}
                    >
                      {(a.displayName || 'A').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{a.displayName}</div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: theme.subText,
                        }}
                      >
                        {a.accountId}
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background:
                          a.status === 'Available'
                            ? '#E3FCEF'
                            : a.status?.toLowerCase().includes('busy') ||
                              a.status?.toLowerCase().includes('meeting')
                            ? '#FFEBE6'
                            : '#F4F5F7',
                        color:
                          a.status === 'Available'
                            ? '#006644'
                            : a.status?.toLowerCase().includes('busy') ||
                              a.status?.toLowerCase().includes('meeting')
                            ? '#BF2600'
                            : '#5E6C84',
                      }}
                    >
                      {a.status || 'Available'}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: a.isOnline ? '#36B37E' : '#FFAB00',
                          boxShadow: a.isOnline
                            ? '0 0 6px rgba(54,179,126,0.7)'
                            : '0 0 6px rgba(255,171,0,0.7)',
                        }}
                      />
                      <div style={{ fontSize: '12px' }}>
                        {a.isOnline ? 'Online' : 'Offline'}{' '}
                        {a.minutesAgo != null && (
                          <span style={{ color: theme.subText }}>
                            ({a.minutesAgo} min ago)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: '#EBECF0',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#42526E',
                      }}
                    >
                      {a.groupName}
                    </span>
                  </td>
                </tr>
              ))}
              {pageAgents.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: theme.subText,
                    }}
                  >
                    No JSM agents match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              fontSize: '12px',
              color: theme.subText,
              gap: '8px',
            }}
          >
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              style={{
                ...styles.btn,
                ...styles.btnGhost,
                padding: '4px 8px',
                fontSize: '11px',
              }}
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <button
              style={{
                ...styles.btn,
                ...styles.btnGhost,
                padding: '4px 8px',
                fontSize: '11px',
              }}
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------
// USER DASHBOARD – presence + Sync with Teams toggle + Teams details
// -----------------------------------------------------------
const UserDashboard = ({ context, isPanel }) => {
  const [myStatus, setMyStatus] = useState('Available');
  const [userProfile, setUserProfile] = useState({
    displayName: 'Crew Member',
    avatarUrl: null,
  });
  const [teamsSync, setTeamsSync] = useState({ syncFromTeams: false });
  const [teamsCfgEnabled, setTeamsCfgEnabled] = useState(false);
  const [presenceDetails, setPresenceDetails] = useState(null);
  const accountId = context.accountId;

  useEffect(() => {
    if (!accountId) return;
    const loadProfileAndSync = async () => {
      try {
        const data = await invoke('getMyself', { accountId });
        if (data && data.displayName) {
          setUserProfile(data);
        }

        const sync = await invoke('getUserTeamsSync', { accountId }).catch(
          () => ({ syncFromTeams: false })
        );
        setTeamsSync(sync);

        const cfg = await invoke('getTeamsConfig').catch(() => null);
        if (cfg) setTeamsCfgEnabled(!!cfg.enabled);
      } catch (e) {
        console.error('UserDashboard init error:', e);
      }
    };

    loadProfileAndSync();

    const tick = async () => {
      try {
        await invoke('sendHeartbeat', { accountId });
        const data = await invoke('getStatus', { accountId });
        setMyStatus(data.status);
        setPresenceDetails(data.presenceDetails || null);
      } catch (e) {
        console.error('heartbeat/getStatus error:', e);
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    invoke('getStatus', { accountId })
      .then((data) => {
        setMyStatus(data.status);
        setPresenceDetails(data.presenceDetails || null);
      })
      .catch((e) => console.error('getStatus error', e));
  }, [accountId, teamsSync.syncFromTeams]);

  const changeStatus = async (newStatus) => {
    setMyStatus(newStatus);
    await invoke('updateStatus', { status: newStatus, accountId });
    const data = await invoke('getStatus', { accountId });
    setPresenceDetails(data.presenceDetails || null);
  };

  const toggleTeamsSync = async () => {
    const newVal = !teamsSync.syncFromTeams;
    setTeamsSync({ syncFromTeams: newVal });
    await invoke('setUserTeamsSync', { accountId, syncFromTeams: newVal });
    await invoke('sendHeartbeat', { accountId });
    const data = await invoke('getStatus', { accountId });
    setMyStatus(data.status);
    setPresenceDetails(data.presenceDetails || null);
  };

  const StatusBtn = ({ text, color, bgActive }) => {
    const active = myStatus === text;
    return (
      <div
        onClick={() => changeStatus(text)}
        style={{
          padding: '16px',
          marginBottom: '12px',
          borderRadius: '12px',
          border: active ? `2px solid ${color}` : '1px solid #F4F5F7',
          background: active ? bgActive : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
          boxShadow: active
            ? `0 4px 15px ${bgActive}`
            : '0 2px 5px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: color,
            marginRight: '15px',
            boxShadow: `0 0 10px ${color}`,
          }}
        />
        <span
          style={{
            flex: 1,
            fontWeight: active ? '700' : '500',
            color: theme.text,
          }}
        >
          {text}
        </span>
        {active && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              color: color,
              letterSpacing: '1px',
            }}
          >
            ACTIVE
          </span>
        )}
      </div>
    );
  };

  const displayName = userProfile.displayName || 'Crew Member';
  const avatarLetter = displayName.charAt(0);

  const getTeamsChip = (availability) => {
    const a = (availability || '').toLowerCase();
    if (a === 'available') return { bg: '#E3FCEF', fg: '#006644', label: 'Available' };
    if (a === 'busy' || a === 'do_not_disturb')
      return { bg: '#FFEBE6', fg: '#BF2600', label: 'Busy / DND' };
    if (a === 'away' || a === 'be_right_back')
      return { bg: '#FFF0B3', fg: '#FF8B00', label: 'Away' };
    if (a === 'offline' || !a)
      return { bg: '#F4F5F7', fg: '#5E6C84', label: 'Offline' };
    return { bg: '#DEEBFF', fg: '#0747A6', label: availability || 'Unknown' };
  };
  const teamsChip = getTeamsChip(
    presenceDetails?.availability || presenceDetails?.teamsAvailability
  );

  return (
    <div
      style={{
        ...styles.container,
        padding: isPanel ? '10px' : '50px',
        maxWidth: isPanel ? '100%' : '600px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.primary}, #36B37E)`,
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 10px 20px rgba(0,82,204,0.3)',
            overflow: 'hidden',
          }}
        >
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={displayName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            avatarLetter
          )}
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: '800',
            color: theme.text,
          }}
        >
          Welcome, {displayName}
        </div>
        <div
          style={{
            fontSize: '14px',
            color: theme.subText,
            marginTop: '5px',
          }}
        >
          Set your availability to start receiving requests.
        </div>
      </div>

      {/* Teams sync toggle */}
      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme.text,
              }}
            >
              Sync my presence with Microsoft Teams
            </div>
            <div
              style={{
                fontSize: '11px',
                color: theme.subText,
                marginTop: '2px',
              }}
            >
              When enabled, CrewRadar will mirror your Teams availability using
              your Jira email address or display name.
            </div>
          </div>
          <label
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '22px',
              opacity: teamsCfgEnabled ? 1 : 0.4,
            }}
          >
            <input
              type="checkbox"
              checked={teamsSync.syncFromTeams && teamsCfgEnabled}
              disabled={!teamsCfgEnabled}
              onChange={toggleTeamsSync}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: teamsCfgEnabled ? 'pointer' : 'not-allowed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor:
                  teamsSync.syncFromTeams && teamsCfgEnabled
                    ? '#36B37E'
                    : '#DFE1E6',
                borderRadius: '34px',
                transition: '.2s',
              }}
            />
            <span
              style={{
                position: 'absolute',
                height: '18px',
                width: '18px',
                left:
                  teamsSync.syncFromTeams && teamsCfgEnabled ? '22px' : '4px',
                bottom: '2px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                transition: '.2s',
              }}
            />
          </label>
        </div>
        {!teamsCfgEnabled && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: theme.subText,
            }}
          >
            Microsoft Teams integration is not configured by your admin.
          </div>
        )}
      </div>

      {/* Jira & Teams presence details card */}
      <div
        style={{
          background: '#fff',
          padding: '18px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1.4fr',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: theme.subText,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            Jira Presence
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                background:
                  myStatus === 'Available'
                    ? '#E3FCEF'
                    : myStatus?.toLowerCase().includes('busy') ||
                      myStatus?.toLowerCase().includes('meeting')
                    ? '#FFEBE6'
                    : myStatus?.toLowerCase().includes('away')
                    ? '#FFF0B3'
                    : '#F4F5F7',
                color:
                  myStatus === 'Available'
                    ? '#006644'
                    : myStatus?.toLowerCase().includes('busy') ||
                      myStatus?.toLowerCase().includes('meeting')
                    ? '#BF2600'
                    : myStatus?.toLowerCase().includes('away')
                    ? '#FF8B00'
                    : '#5E6C84',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {myStatus}
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: theme.subText,
            }}
          >
            This is the status CrewRadar uses for auto-assignment.
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: theme.subText,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}
          >
            Microsoft Teams Presence
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: teamsChip.bg,
                border: `2px solid ${teamsChip.fg}`,
                boxShadow: `0 0 6px ${teamsChip.fg}55`,
              }}
            />
            <span
              style={{
                padding: '3px 9px',
                borderRadius: '999px',
                background: teamsChip.bg,
                color: teamsChip.fg,
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              {teamsChip.label}
            </span>
            {presenceDetails && presenceDetails.activity && (
              <span
                style={{
                  fontSize: '11px',
                  color: theme.subText,
                }}
              >
                ({presenceDetails.activity})
              </span>
            )}
          </div>

          {presenceDetails ? (
            <div
              style={{
                fontSize: '11px',
                color: theme.subText,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 12px',
              }}
            >
              <div>
                <strong>Mapped Jira status:</strong>{' '}
                <span style={{ color: theme.text, fontWeight: 600 }}>
                  {presenceDetails.mappedStatus || myStatus}
                </span>
              </div>
              {presenceDetails.msUserId && (
                <div>
                  <strong>Teams user:</strong>{' '}
                  <span style={{ color: theme.text }}>
                    {presenceDetails.msUserId.substring(0, 8)}...
                  </span>
                </div>
              )}
              {presenceDetails.sequenceNumber && (
                <div>
                  <strong>Seq#:</strong>{' '}
                  <span>{presenceDetails.sequenceNumber}</span>
                </div>
              )}
              {presenceDetails.workLocation && (
                <div>
                  <strong>Work location:</strong>{' '}
                  <span>{presenceDetails.workLocation}</span>
                </div>
              )}
              {presenceDetails.isOutOfOffice && (
                <div>
                  <strong>Out of office:</strong>{' '}
                  <span style={{ color: '#BF2600' }}>Yes</span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: '11px',
                color: theme.subText,
              }}
            >
              No Teams presence data yet. Enable sync or wait a few seconds.
            </div>
          )}
        </div>
      </div>

      {/* Connectivity card */}
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          marginBottom: '30px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.success}, ${theme.primary})`,
          }}
        />
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: theme.subText,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
          }}
        >
          CrewRadar Connectivity
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: theme.success,
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: theme.success,
            }}
          >
            Monitoring Active
          </span>
        </div>
      </div>

      <div
        style={{
          marginBottom: '15px',
          fontSize: '12px',
          fontWeight: '700',
          color: theme.subText,
          textTransform: 'uppercase',
        }}
      >
        Select Your Presence
      </div>

      <StatusBtn text="Available" color="#36B37E" bgActive="#E3FCEF" />
      <div style={{ height: '10px' }} />
      <StatusBtn text="Busy" color="#FF5630" bgActive="#FFEBE6" />
      <StatusBtn text="In a meeting" color="#FF5630" bgActive="#FFEBE6" />
      <StatusBtn text="Do not disturb" color="#FF5630" bgActive="#FFEBE6" />
      <div style={{ height: '10px' }} />
      <StatusBtn text="Away" color="#FFAB00" bgActive="#FFF0B3" />
      <StatusBtn text="Be right back" color="#FFAB00" bgActive="#FFF0B3" />
      <StatusBtn
        text="Off Work (out of office)"
        color="#6B778C"
        bgActive="#F4F5F7"
      />
    </div>
  );
};

export default App;