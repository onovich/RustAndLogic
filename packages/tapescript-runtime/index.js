const ACTION_NAMES = new Set(["Move", "MoveToward", "Turn", "PickUp", "Drop", "Unload", "Fire", "Wait", "Repair"]);
const DIRECTION_ARGS = new Set(["Forward", "Back"]);
const TURN_ARGS = new Set(["Left", "Right", "Around"]);
const ITEM_ARGS = new Set(["Scrap", "Battery"]);
const ENTITY_ARGS = new Set(["Enemy"]);
const TERRAIN_ARGS = new Set(["Wall", "Home"]);
const CHECK_TARGETS = new Set(["Forward", "Here", "Home", "Cargo", "HP", "Energy", "Damage"]);

export function compileTapeScript(source, options = {}) {
  const instructionCapacity = options.instructionCapacity ?? 8;
  const errors = [];
  const rows = [];
  const labels = new Map();

  source.split(/\r?\n/).forEach((rawLine, sourceLine) => {
    const withoutComment = stripComment(rawLine).trim();
    if (!withoutComment) {
      return;
    }

    const rowIndex = rows.length;
    if (withoutComment.startsWith("@")) {
      const name = withoutComment.slice(1);
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
        errors.push({ line: sourceLine + 1, message: `Invalid label name: ${withoutComment}` });
      } else if (labels.has(name)) {
        errors.push({ line: sourceLine + 1, message: `Duplicate label: ${withoutComment}` });
      } else {
        labels.set(name, rowIndex);
      }
      rows.push({ type: "label", label: name, source: withoutComment, sourceLine: sourceLine + 1 });
      return;
    }

    const parsed = parseStatement(withoutComment);
    if (parsed.errors.length > 0) {
      errors.push(...parsed.errors.map((message) => ({ line: sourceLine + 1, message })));
      rows.push({ type: "fault", op: parsed.op ?? firstToken(withoutComment), source: withoutComment, sourceLine: sourceLine + 1 });
      return;
    }

    rows.push({ ...parsed.instruction, source: withoutComment, sourceLine: sourceLine + 1 });
  });

  if (rows.length > instructionCapacity) {
    errors.push({
      line: 0,
      message: `Instruction memory exceeded: ${rows.length}/${instructionCapacity} slots used.`,
    });
  }

  const instructions = rows.map((row) => {
    if (!["branch", "conditional"].includes(row.type) || row.inner?.type !== "branch") {
      return row;
    }

    if (!labels.has(row.inner.label)) {
      errors.push({ line: row.sourceLine, message: `Unknown label: @${row.inner.label}` });
      return {
        ...row,
        inner: { ...row.inner, target: -1 },
      };
    }

    return {
      ...row,
      inner: { ...row.inner, target: labels.get(row.inner.label) },
    };
  }).map((row) => {
    if (row.type !== "branch") {
      return row;
    }

    if (!labels.has(row.label)) {
      errors.push({ line: row.sourceLine, message: `Unknown label: @${row.label}` });
      return { ...row, target: -1 };
    }

    return { ...row, target: labels.get(row.label) };
  });

  return {
    ok: errors.length === 0,
    errors,
    instructions,
    labels: Object.fromEntries(labels.entries()),
    instructionUsed: rows.length,
    instructionCapacity,
  };
}

export function createVm(program) {
  return {
    pc: 0,
    cf: false,
    state: program.ok ? "Ready" : "Fault",
    fault: program.ok ? "" : program.errors[0]?.message ?? "Compile failed.",
  };
}

export function executeUntilPhysical(program, vm, hardware, options = {}) {
  const maxLogicSteps = options.maxLogicSteps ?? 20;
  const events = [];
  let logicSteps = 0;

  if (vm.state === "Fault") {
    return { status: "fault", events: [{ type: "fault", message: vm.fault }] };
  }

  while (logicSteps <= maxLogicSteps) {
    if (vm.pc < 0 || vm.pc >= program.instructions.length) {
      vm.state = "Halted";
      events.push({ type: "halt", message: "Program counter left executable memory." });
      return { status: "halted", events };
    }

    const instruction = program.instructions[vm.pc];
    events.push({ type: "trace", pc: vm.pc, source: instruction.source });

    if (instruction.type === "label") {
      vm.pc += 1;
      logicSteps += 1;
      continue;
    }

    if (instruction.type === "query") {
      vm.cf = Boolean(hardware.query(instruction));
      events.push({ type: "query", op: describeInstruction(instruction), value: vm.cf });
      vm.pc += 1;
      logicSteps += 1;
      continue;
    }

    if (instruction.type === "branch") {
      vm.pc = instruction.target;
      events.push({ type: "branch", op: describeInstruction(instruction), taken: true, target: instruction.target });
      logicSteps += 1;
      continue;
    }

    if (instruction.type === "conditional") {
      const shouldRun = instruction.condition === "true" ? vm.cf : !vm.cf;
      events.push({ type: "branch", op: describeInstruction(instruction), taken: shouldRun, target: instruction.inner.target });
      if (!shouldRun) {
        vm.pc += 1;
        logicSteps += 1;
        continue;
      }
      if (instruction.inner.type === "branch") {
        vm.pc = instruction.inner.target;
        logicSteps += 1;
        continue;
      }
      const result = hardware.action(instruction.inner);
      events.push({ type: "action", op: describeInstruction(instruction.inner), result });
      vm.pc += 1;
      vm.state = "Suspended";
      return { status: "suspended", events };
    }

    if (instruction.type === "action") {
      const result = hardware.action(instruction);
      events.push({ type: "action", op: describeInstruction(instruction), result });
      vm.pc += 1;
      vm.state = "Suspended";
      return { status: "suspended", events };
    }

    vm.state = "Fault";
    vm.fault = `Cannot execute row ${vm.pc}.`;
    events.push({ type: "fault", message: vm.fault });
    return { status: "fault", events };
  }

  vm.state = "Fault";
  vm.fault = "Logic Overload: watchdog stopped an infinite logic loop.";
  events.push({ type: "fault", message: vm.fault });
  return { status: "fault", events };
}

export function describeInstruction(instruction) {
  if (!instruction) {
    return "";
  }
  if (instruction.type === "branch") {
    return `Goto @${instruction.label}`;
  }
  if (instruction.type === "conditional") {
    return `If${instruction.condition === "true" ? "True" : "False"} ${describeInstruction(instruction.inner)}`;
  }
  if (instruction.type === "query") {
    const target = instruction.target === "Forward" ? "" : instruction.target;
    if (instruction.predicate === "IsEmpty" || instruction.predicate === "Any" || instruction.predicate === "IsFull") {
      return `Check(${target}).${instruction.predicate}()`;
    }
    return `Check(${target}).${instruction.predicate}(${instruction.value})`;
  }
  if (instruction.type === "action") {
    if (["Wait", "Repair"].includes(instruction.op)) {
      return `${instruction.op}()`;
    }
    const defaultArg = ["Move", "PickUp", "Drop", "Fire"].includes(instruction.op) && instruction.arg === "Forward";
    return `${instruction.op}(${defaultArg ? "" : instruction.arg})`;
  }
  return instruction.source ?? instruction.op ?? "";
}

function parseStatement(source) {
  const conditional = source.match(/^If(True|False)\s+(.+)$/);
  if (conditional) {
    const inner = parseActionOrBranch(conditional[2]);
    if (inner.errors.length > 0) {
      return inner;
    }
    return {
      errors: [],
      instruction: {
        type: "conditional",
        condition: conditional[1] === "True" ? "true" : "false",
        inner: inner.instruction,
      },
    };
  }

  const query = parseQuery(source);
  if (query) {
    return query;
  }

  return parseActionOrBranch(source);
}

function parseActionOrBranch(source) {
  const branch = source.match(/^Goto\s+(@[A-Za-z][A-Za-z0-9_]*)$/);
  if (branch) {
    return { errors: [], instruction: { type: "branch", op: "Goto", label: branch[1].slice(1) } };
  }
  if (source.startsWith("Goto")) {
    return { errors: ["Goto requires one @Label operand."], op: "Goto" };
  }
  return parseAction(source);
}

function parseAction(source) {
  const call = parseCall(source);
  if (!call) {
    return { errors: [`Unknown instruction: ${firstToken(source)}`], op: firstToken(source) };
  }
  if (!ACTION_NAMES.has(call.name)) {
    return { errors: [`Unknown instruction: ${call.name}`], op: call.name };
  }

  if (call.name === "Move") {
    return singleArgAction(call, "Forward", DIRECTION_ARGS);
  }
  if (call.name === "MoveToward") {
    return singleArgAction(call, "", new Set(["Home"]));
  }
  if (call.name === "Turn") {
    return singleArgAction(call, "", TURN_ARGS);
  }
  if (["PickUp", "Drop", "Fire"].includes(call.name)) {
    return singleArgAction(call, "Forward", new Set(["Forward"]));
  }
  if (call.name === "Unload") {
    return singleArgAction(call, "", new Set(["Home"]));
  }
  if (["Wait", "Repair"].includes(call.name)) {
    if (call.arg) {
      return { errors: [`${call.name}() does not take parameters.`], op: call.name };
    }
    return { errors: [], instruction: { type: "action", op: call.name, arg: "" } };
  }

  return { errors: [`Unknown instruction: ${call.name}`], op: call.name };
}

function singleArgAction(call, defaultArg, allowed) {
  const arg = call.arg || defaultArg;
  if (!arg) {
    return { errors: [`${call.name}() requires one parameter.`], op: call.name };
  }
  if (!allowed.has(arg)) {
    return { errors: [`Invalid ${call.name}() parameter: ${arg}.`], op: call.name };
  }
  return { errors: [], instruction: { type: "action", op: call.name, arg } };
}

function parseQuery(source) {
  const match = source.match(/^Check\(([^()]*)\)\.([A-Za-z][A-Za-z0-9_]*)\(([^()]*)\)$/);
  if (!match) {
    if (source.startsWith("Check")) {
      return { errors: ["Invalid Check syntax."], op: "Check" };
    }
    return null;
  }

  const target = match[1].trim() || "Forward";
  const predicate = match[2];
  const value = match[3].trim();

  if (!CHECK_TARGETS.has(target)) {
    return { errors: [`Invalid Check() target: ${target}.`], op: "Check" };
  }

  if (["Forward", "Here", "Home"].includes(target)) {
    if (predicate === "Has") {
      if (!ITEM_ARGS.has(value) && !ENTITY_ARGS.has(value)) {
        return { errors: [`Invalid Has() value: ${value}.`], op: "Check" };
      }
      return { errors: [], instruction: { type: "query", target, predicate, value } };
    }
    if (predicate === "Is") {
      if (!TERRAIN_ARGS.has(value)) {
        return { errors: [`Invalid Is() value: ${value}.`], op: "Check" };
      }
      return { errors: [], instruction: { type: "query", target, predicate, value } };
    }
    if (predicate === "IsEmpty" && !value) {
      return { errors: [], instruction: { type: "query", target, predicate, value: "" } };
    }
  }

  if (target === "Cargo") {
    if (predicate === "Has") {
      if (!ITEM_ARGS.has(value)) {
        return { errors: [`Invalid Cargo.Has() value: ${value}.`], op: "Check" };
      }
      return { errors: [], instruction: { type: "query", target, predicate, value } };
    }
    if (["Any", "IsFull"].includes(predicate) && !value) {
      return { errors: [], instruction: { type: "query", target, predicate, value: "" } };
    }
  }

  if (["HP", "Energy", "Damage"].includes(target) && ["Below", "Above"].includes(predicate)) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return { errors: [`${predicate}() requires a number.`], op: "Check" };
    }
    return { errors: [], instruction: { type: "query", target, predicate, value: amount } };
  }

  return { errors: [`Invalid Check(${target}).${predicate}() query.`], op: "Check" };
}

function parseCall(source) {
  const match = source.match(/^([A-Za-z][A-Za-z0-9_]*)\(([^()]*)\)$/);
  if (!match) {
    return null;
  }
  return {
    name: match[1],
    arg: match[2].trim(),
  };
}

function stripComment(line) {
  return line.split("//")[0];
}

function firstToken(source) {
  return source.trim().split(/[\s(.]+/)[0] || source;
}
