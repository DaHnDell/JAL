(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.jal = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VERSION = '1.1.0';
  const NAME = 'Javascript Appropriate Logger';
  const PREFIX = 'JAL';
  
  let enabled = true;
  let config = {
    showTimestamp: false,
    groupObjects: true,
    maxDepth: 3,
    logLevel: 'debug'
  };

  const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  const levelColors = {
    debug: 'color:#73bed9;font-weight:bold;',
    info: 'color:#4caf50;font-weight:bold;',
    warn: 'color:#ff9800;font-weight:bold;',
    error: 'color:#f44336;font-weight:bold;'
  };
  
  const cache = new WeakMap();
  const circularRefs = new WeakSet();

  const locationOf = () => {
    const stack = new Error().stack?.split('\n') || [];
    let targetLine = '';
    
    for (let i = 2; i < Math.min(stack.length, 6); i++) {
      const line = stack[i]?.trim() || '';
      if (!line.includes('logger') && !line.includes('locationOf') && !line.includes('log')) {
        targetLine = line;
        break;
      }
    }
    
    if (!targetLine) targetLine = stack[3]?.trim() || '';
    
    // Chrome/Edge 형식
    let match = targetLine.match(/\((.*)\)/) || targetLine.match(/at\s+(.*)/);
    let full = match ? match[1] : 'unknown location';
    
    // Firefox/Safari 형식
    if (!match) {
      match = targetLine.match(/@(.*)/) || targetLine.match(/(http.*)/);
      full = match ? match[1] : targetLine || 'unknown location';
    }
    
    const compact = full.match(/([^\\/]+\.js.*):(\d+):(\d+)$/);
    return { 
      full, 
      compact: compact ? `${compact[1]}:${compact[2]}:${compact[3]}` : full 
    };
  };

  const typeOf = (v) => {
    if (Array.isArray(v)) return 'array';
    if (v === null) return 'null';
    if (v instanceof Date) return 'date';
    if (v instanceof RegExp) return 'regexp';
    if (v instanceof Promise) return 'promise';
    return typeof v;
  };

  const resolveName = (arg) => {
    if (cache.has(arg)) return cache.get(arg);
    
    const type = typeOf(arg);
    if (type !== 'function') return `(${type})`;
    
    if (arg.name) {
      cache.set(arg, arg.name);
      return arg.name;
    }
    
    const commonGlobals = ['Array', 'Object', 'String', 'Number', 'Boolean', 
                          'Function', 'Date', 'RegExp', 'Error', 'Promise'];
    
    for (const key of commonGlobals) {
      if (globalThis[key] === arg) {
        cache.set(arg, key);
        return key;
      }
    }
    
    return '(anonymous)';
  };

const isSafeToLog = (obj, depth = 0, circularRefs) => {
  if (depth > config.maxDepth) return false;
  if (obj === null || typeof obj !== 'object') return true;
  if (!circularRefs) return true;  
  if (circularRefs.has(obj)) return false;
  return true;
};
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${
      now.getMinutes().toString().padStart(2, '0')}:${
      now.getSeconds().toString().padStart(2, '0')}.${
      now.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const logger = (...args) => {
    return log('debug', ...args);
  };

  const log = (level, ...args) => {
    if (!enabled) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[config.logLevel]) return;
    
    const { full, compact } = locationOf();const isSafeToLog = (obj, depth = 0, circularRefs) => {
  if (depth > config.maxDepth) return false;
  if (obj === null || typeof obj !== 'object') return true;
  if (circularRefs.has(obj)) return false;
  return true;
};
    const timestamp = config.showTimestamp ? `[${getTimestamp()}] ` : '';
    const levelTag = level !== 'debug' ? ` ${level.toUpperCase()}` : '';
    const style = levelColors[level] || levelColors.debug;

    args.forEach((arg) => {
      // circularRefs.clear();
      
      if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
        if (!isSafeToLog(arg, 0, circularRefs)) {
          console.log(
            `%c❖ ${PREFIX}@${compact}${levelTag}\n${timestamp}› [Circular Reference Detected]\n· ${full}`,
            style
          );
          return;
        }
        
        circularRefs.add(arg);
        
        if (config.groupObjects) {
          const keys = Object.keys(arg);
          console.log(
            `%c❖ ${PREFIX}@${compact}${levelTag}\n${timestamp}› object (${keys.length} keys)\n· ${full}`,
            style,
            arg
          );
        } else {
          Object.entries(arg).forEach(([k, v]) => {
            console.log(
              `%c❖ ${PREFIX}@${compact}${levelTag}\n${timestamp}› ${k} (${typeOf(v)})\n· ${full}`,
              style,
              v
            );
          });
        }
      } else {
        const name = resolveName(arg);
        console.log(
          `%c❖ ${PREFIX}@${compact}${levelTag}\n${timestamp}› ${name} (${typeOf(arg)})\n· ${full}`,
          style,
          arg
        );
      }
    });
  };

  const printBanner = () => {
    console.log(
`%c
     ██╗ █████╗ ██╗       using ${NAME}
     ██║██╔══██╗██║       provided version : ${VERSION.padEnd(8)}
     ██║███████║██║       Logging should feel right...
██   ██║██╔══██║██║       Stay LOGGED ? → https://github.com/DaHnDell/jal
╚█████╔╝██║  ██║███████╗  Copyright 2025. DahnDell All rights reserved.
 ╚════╝ ╚═╝  ╚═╝╚══════╝`,
      levelColors.debug
    );
  };

  const api = {
    // 기본 로거
    logger,
    
    // 레벨별 로거
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
    
    // 테이블 형식 출력
    table: (data, columns) => {
      if (!enabled) return;
      const { full, compact } = locationOf();
      const timestamp = config.showTimestamp ? `[${getTimestamp()}] ` : '';
      console.log(
        `%c❖ ${PREFIX}@${compact} TABLE\n${timestamp}· ${full}`,
        levelColors.info
      );
      console.table(data, columns);
    },
    
    // 전체 스택 트레이스
    trace: (label, ...data) => {
      if (!enabled) return;
      const { full, compact } = locationOf();
      const timestamp = config.showTimestamp ? `[${getTimestamp()}] ` : '';
      console.log(
        `%c❖ ${PREFIX}@${compact} TRACE\n${timestamp}› ${label}\n· ${full}`,
        levelColors.debug
      );
      if (data.length > 0) {
        console.log(...data);
      }
      console.trace();
    },
    
    // 조건부 로깅
    when: (condition, ...args) => {
      if (!condition) return;
      log('debug', ...args);
    },
    
    // 유틸리티
    name: NAME,
    enable: () => (enabled = true),
    disable: () => (enabled = false),
    init: printBanner,
    
    // 설정
    config: (options) => {
      config = { ...config, ...options };
      return config;
    },
    getConfig: () => ({ ...config }),
    
    // 그룹 로깅
    group: (label, fn) => {
      if (!enabled) return;
      console.group(`${PREFIX}: ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    },
    
    groupCollapsed: (label, fn) => {
      if (!enabled) return;
      console.groupCollapsed(`${PREFIX}: ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    },
    
    // 성능 측정
    time: (label) => {
      if (!enabled) return;
      console.time(`${PREFIX}: ${label}`);
    },
    
    timeEnd: (label) => {
      if (!enabled) return;
      console.timeEnd(`${PREFIX}: ${label}`);
    }
  };

  Object.defineProperty(api, 'version', {
    get() {
      printBanner();
      return VERSION;
    },
  });

  return api;
});