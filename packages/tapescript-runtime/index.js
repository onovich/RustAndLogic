const ACTIONS = new Set(["MoveForward", "TurnLeft", "TurnRight", "PickUp", "Drop", "Fire"]);
const QUERIES = new Set(["CheckScrap", "CheckEnemy", "CheckHP_Low"]);

export function compileTapeScript(source, options = {}) {
  const tapeCapacity = options.tapeCapacity ?? 8;
  const errors = [];
  const rows = [];
  const labels = new Map();

  source.split(/\r?\n/).forEach((rawLine, sourceLine) => {
    const withoutComment = rawLine.split("//")[0].trim();
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

    const parts = withoutComment.split(/\s+/);
    const instruction = parts[0];
    const operand = parts[1];

    if (ACTIONS.has(instruction)) {
      if (parts.length !== 1) {
        errors.push({ line: sourceLine + 1, message: `${instruction} does not take operands.` });
      }
      rows.push({ type: "action", op: instruction, source: withoutComment, sourceLine: sourceLine + 1 });
      return;
    }

    if (QUERIES.has(instruction)) {
      if (parts.length !== 1) {
        errors.push({ line: sourceLine + 1, message: `${instruction} does not take operands.` });
      }
      rows.push({ type: "query", op: instruction, source: withoutComment, sourceLine: sourceLine + 1 });
      return;
    }

    if (["Jump", "JumpIfTrue", "JumpIfFalse"].includes(instruction)) {
      if (parts.length !== 2 || !operand.startsWith("@")) {
        errors.push({ line: sourceLine + 1, message: `${instruction} requires one @Label operand.` });
      }
      rows.push({
        type: "branch",
        op: instruction,
        label: operand?.slice(1) ?? "",
        source: withoutComment,
        sourceLine: sourceLine + 1,
      });
      return;
    }

    errors.push({ line: sourceLine + 1, message: `Unknown instruction: ${instruction}` });
    rows.push({ type: "fault", op: instruction, source: withoutComment, sourceLine: sourceLine + 1 });
  });

  if (rows.length > tapeCapacity) {
    errors.push({
      line: 0,
      message: `Tape capacity exceeded: ${rows.length}/${tapeCapacity} rows used.`,
    });
  }

  const instructions = rows.map((row) => {
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
    tapeUsed: rows.length,
    tapeCapacity,
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
      events.push({ type: "halt", message: "Program counter left the tape." });
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
      vm.cf = Boolean(hardware.query(instruction.op));
      events.push({ type: "query", op: instruction.op, value: vm.cf });
      vm.pc += 1;
      logicSteps += 1;
      continue;
    }

    if (instruction.type === "branch") {
      const shouldJump =
        instruction.op === "Jump" ||
        (instruction.op === "JumpIfTrue" && vm.cf) ||
        (instruction.op === "JumpIfFalse" && !vm.cf);
      vm.pc = shouldJump ? instruction.target : vm.pc + 1;
      events.push({ type: "branch", op: instruction.op, taken: shouldJump, target: instruction.target });
      logicSteps += 1;
      continue;
    }

    if (instruction.type === "action") {
      const result = hardware.action(instruction.op);
      events.push({ type: "action", op: instruction.op, result });
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

