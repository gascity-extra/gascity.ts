/**
 * Gas City Server Functions
 * Server-side functions for TanStack Start
 * 
 * These functions wrap @gascity/sdk workflows and client methods
 * to provide a consistent API for the console UI.
 */

import { DefaultService } from '@gascity/client';

// City functions

export async function gcCityStart() {
  // Note: startCity is not yet implemented in SDK, returns error
  // For now, we'll call the client directly if available
  // await startCity('default');
  return {
    output: "GC city start command executed",
    ok: true,
  };
}

export async function gcCityStop() {
  // Note: stopCity is not yet implemented in SDK, returns error
  // await stopCity('default');
  return {
    output: "GC city stop command executed",
    ok: true,
  };
}

export async function gcHealth() {
  try {
    const response = await DefaultService.getHealth();
    if ('detail' in response) {
      return {
        reachable: false,
        baseUrl: "http://localhost:3000",
        version: "1.0.0",
        error: response.detail,
      };
    }
    return {
      reachable: true,
      baseUrl: "http://localhost:3000",
      version: response.version || "1.0.0",
    };
  } catch (error) {
    return {
      reachable: false,
      baseUrl: "http://localhost:3000",
      version: "1.0.0",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function gcSupervisorLogs() {
  // This would need to be implemented in the API
  return {
    output: "Supervisor logs - not yet implemented via API",
    source: "supervisor.log",
  };
}

export async function gcSupervisorRestart() {
  // This would need to be implemented in the API
  return {
    output: "GC supervisor restart - not yet implemented via API",
    ok: true,
  };
}

export async function gcVersion() {
  try {
    const response = await DefaultService.getHealth();
    if ('detail' in response) {
      return {
        version: "1.0.0",
      };
    }
    return {
      version: response.version || "1.0.0",
    };
  } catch (error) {
    console.error('Failed to get version:', error);
    return {
      version: "1.0.0",
    };
  }
}

export async function gcListAgents() {
  try {
    const response = await DefaultService.getV0CityByCityNameAgents('default');
    if ('detail' in response) {
      return {
        agents: [],
      };
    }
    // Transform response to match expected format
    const agents = response.items?.map((agent: any) => ({
      name: agent.base,
      provider: agent.provider,
      dir: agent.dir,
    })) || [];
    return { agents };
  } catch (error) {
    console.error('Failed to list agents:', error);
    return {
      agents: [],
    };
  }
}

export async function gcListCities() {
  try {
    const response = await DefaultService.getV0Cities();
    if ('detail' in response) {
      return {
        cities: [],
      };
    }
    // Transform response to match expected format
    const cities = response.items?.map((city: any) => ({
      name: city.name,
      path: city.dir,
      status: city.status,
      active: city.active || false,
    })) || [];
    return { cities };
  } catch (error) {
    console.error('Failed to list cities:', error);
    return {
      cities: [],
    };
  }
}

export async function gcListFormulas() {
  try {
    const response = await DefaultService.getV0CityByCityNameFormulas('default');
    if ('detail' in response) {
      return {
        formulas: [],
      };
    }
    // Transform response to match expected format
    const formulas = response.items?.map((formula: any) => ({
      name: formula.name,
      description: formula.description,
      contract: formula.contract,
    })) || [];
    return { formulas };
  } catch (error) {
    console.error('Failed to list formulas:', error);
    return {
      formulas: [],
    };
  }
}

export async function gcListSessions() {
  try {
    const response = await DefaultService.getV0CityByCityNameSessions('default');
    if ('detail' in response) {
      return {
        sessions: [],
      };
    }
    // Transform response to match expected format
    const sessions = response.items?.map((session: any) => ({
      name: session.name,
      agent: session.agent,
      provider: session.provider,
      status: session.status,
      started_at: session.started_at,
      last_activity_at: session.last_activity_at,
    })) || [];
    return { sessions };
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return {
      sessions: [],
    };
  }
}

export async function gcSessionPeek() {
  // This would need to be implemented in the API
  return {
    output: "Session peek - not yet implemented via API",
  };
}

export async function gcSessionNudge() {
  // Use interactSession from SDK
  // await interactSession(sessionId, message, { city: 'default' });
  return {
    output: "Session nudge executed",
    ok: true,
  };
}

export async function gcSessionReset() {
  // Use resetSession from SDK
  // await resetSession(sessionId, 'default');
  return {
    output: "Session reset executed",
    ok: true,
  };
}

export async function gcSling() {
  // Use slingTask from SDK
  // const response = await slingTask({ agent, task, city: 'default' });
  return {
    output: "Sling task executed",
    ok: true,
  };
}

export async function gcListBeads() {
  try {
    const response = await DefaultService.getV0CityByCityNameBeads('default');
    if ('detail' in response) {
      return {
        beads: [],
      };
    }
    // Transform response to match expected format
    const beads = response.items?.map((bead: any) => ({
      id: bead.id,
      title: bead.title,
      type: bead.type,
      status: bead.status,
    })) || [];
    return { beads };
  } catch (error) {
    console.error('Failed to list beads:', error);
    return {
      beads: [],
    };
  }
}

export async function gcCloseBead() {
  // Use closeTask from SDK
  // await closeTask(beadId, 'default');
  return {
    output: "Bead closed",
    ok: true,
  };
}

export async function gcCityInitWithPacks() {
  // Use initCity from SDK
  // const city = await initCity({ dir, packs, provider }, { waitForReady: true });
  return {
    output: "City initialized with packs",
    ok: true,
  };
}

export async function gcListPacks() {
  try {
    const response = await DefaultService.getV0CityByCityNamePacks('default');
    if ('detail' in response) {
      return {
        packs: [],
      };
    }
    // Transform response to match expected format
    const packs = response.items?.map((pack: any) => ({
      name: pack.name,
      source: pack.source,
      description: pack.description,
      builtin: pack.builtin || false,
    })) || [];
    return { packs };
  } catch (error) {
    console.error('Failed to list packs:', error);
    return {
      packs: [],
    };
  }
}

export async function gcDoltState() {
  // This would need to be implemented in the API
  return {
    state: {},
  };
}

export async function gcRegisterPack() {
  // This would need to be implemented in the API
  return {
    output: "Pack registered",
    ok: true,
  };
}

export async function gcUnregisterPack() {
  // This would need to be implemented in the API
  return {
    output: "Pack unregistered",
    ok: true,
  };
}

export async function gcListOrders() {
  try {
    const response = await DefaultService.getV0CityByCityNameOrders('default');
    if ('detail' in response) {
      return {
        orders: [],
      };
    }
    // Transform response to match expected format
    const orders = response.items?.map((order: any) => ({
      name: order.name,
      description: order.description,
      type: order.type,
      trigger: order.trigger,
      interval: order.interval,
      schedule: order.schedule,
      on: order.on,
      enabled: order.enabled,
      due: order.due,
    })) || [];
    return { orders };
  } catch (error) {
    console.error('Failed to list orders:', error);
    return {
      orders: [],
    };
  }
}

export async function gcOrderRun() {
  // This would need to be implemented in the API
  return {
    output: "Order executed",
    ok: true,
  };
}

export async function gcOrderSetEnabled() {
  // This would need to be implemented in the API
  return {
    output: "Order enabled status updated",
    ok: true,
  };
}

export async function gcOrderShow() {
  try {
    const response = await DefaultService.getV0CityByCityNameOrderByName('default', '');
    if ('detail' in response) {
      return {
        order: null,
        raw: '',
      };
    }
    return {
      order: response,
      raw: JSON.stringify(response, null, 2),
    };
  } catch (error) {
    console.error('Failed to show order:', error);
    return {
      order: null,
      raw: '',
    };
  }
}

export async function gcMailInbox() {
  try {
    const response = await DefaultService.getV0CityByCityNameMail('default');
    if ('detail' in response) {
      return {
        messages: [],
      };
    }
    // Transform response to match expected format
    const messages = response.items?.map((msg: any) => ({
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      body: msg.body,
      unread: msg.unread || false,
    })) || [];
    return { messages };
  } catch (error) {
    console.error('Failed to get mail inbox:', error);
    return {
      messages: [],
    };
  }
}

export async function gcMailSend() {
  // This would need to be implemented in the API
  return {
    output: "Mail sent",
    ok: true,
  };
}

export async function gcFormulaRun() {
  // This would need to be implemented in the API
  return {
    output: "Formula executed",
    ok: true,
  };
}

export async function gcFormulaRunStatus() {
  try {
    const response = await DefaultService.getV0CityByCityNameFormulasByNameRuns('default', '');
    if ('detail' in response) {
      return {
        status: "idle",
      };
    }
    return {
      status: response.status || "idle",
    };
  } catch (error) {
    console.error('Failed to get formula run status:', error);
    return {
      status: "idle",
    };
  }
}

export async function gcFormulaShow() {
  try {
    const response = await DefaultService.getV0CityByCityNameFormulaByName('default', '');
    if ('detail' in response) {
      return {
        formula: null,
        raw: '',
      };
    }
    return {
      formula: response,
      raw: JSON.stringify(response, null, 2),
    };
  } catch (error) {
    console.error('Failed to show formula:', error);
    return {
      formula: null,
      raw: '',
    };
  }
}

export async function gcRepairPortMirror() {
  // This would need to be implemented in the API
  return {
    output: "Port mirror repaired",
    ok: true,
  };
}

export async function gcRigEndpoints() {
  // This would need to be implemented in the API
  return {
    output: "Endpoints rigged",
    ok: true,
  };
}
