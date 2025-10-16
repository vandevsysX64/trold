(function (Scratch) {
  'use strict';

  // Ensure we're allowed to touch browser APIs (needed in TurboWarp)
  if (!Scratch?.extensions?.unsandboxed) {
    throw new Error('This extension must be run unsandboxed (TurboWarp: OK by default).');
  }

  const BlockType = Scratch.BlockType;
  const ArgumentType = Scratch.ArgumentType;

  class BrowserNotify {
    constructor() {
      this._lastNotification = null;
    }

    getInfo() {
      return {
        id: 'browserNotify',
        name: 'Browser Notifications',
        color1: '#ff4c4c',
        color2: '#cc3d3d',
        blocks: [
          {
            opcode: 'requestPermission',
            blockType: BlockType.COMMAND,
            text: 'request notification permission',
          },
          {
            opcode: 'permissionStatus',
            blockType: BlockType.REPORTER,
            text: 'notification permission',
          },
          {
            opcode: 'canNotify',
            blockType: BlockType.BOOLEAN,
            text: 'can send notifications?',
          },
          '---',
          {
            opcode: 'sendNotification',
            blockType: BlockType.COMMAND,
            text: 'send notification title [TITLE] message [MESSAGE] icon [ICON] silent [SILENT]',
            arguments: {
              TITLE: { type: ArgumentType.STRING, defaultValue: 'Hello from TurboWarp!' },
              MESSAGE: { type: ArgumentType.STRING, defaultValue: 'This is a notification.' },
              ICON: { type: ArgumentType.STRING, defaultValue: '' }, // URL to an image (optional)
              SILENT: { type: ArgumentType.BOOLEAN, defaultValue: false }
            }
          },
          {
            opcode: 'closeLast',
            blockType: BlockType.COMMAND,
            text: 'close last notification'
          }
        ]
      };
    }

    _supported() {
      return typeof Notification !== 'undefined';
    }

    permissionStatus() {
      if (!this._supported()) return 'unsupported';
      // 'default' | 'granted' | 'denied'
      return Notification.permission;
    }

    canNotify() {
      return this._supported() && Notification.permission === 'granted';
    }

    async requestPermission() {
      if (!this._supported()) return;
      try {
        // Most browsers require user gesture; call this from a click/keypress
        await Notification.requestPermission();
      } catch (e) {
        console.warn('[Notifications] requestPermission failed:', e);
      }
    }

    sendNotification(args) {
      if (!this._supported()) return;
      if (Notification.permission !== 'granted') {
        console.warn('[Notifications] Not granted. Use "request notification permission" first.');
        return;
      }

      const title = String(args.TITLE ?? '');
      const body = String(args.MESSAGE ?? '');
      const icon = String(args.ICON ?? '').trim();
      const silent = Scratch.Cast.toBoolean(args.SILENT);

      /** @type {NotificationOptions} */
      const options = { body, silent };
      if (icon) options.icon = icon;

      try {
        const n = new Notification(title || 'Notification', options);
        this._lastNotification = n;

        // Focus the editor tab when the notification is clicked
        n.onclick = () => {
          try { window.focus(); } catch {}
        };

        // Clean up reference when it closes
        n.onclose = () => {
          if (this._lastNotification === n) this._lastNotification = null;
        };
      } catch (e) {
        console.warn('[Notifications] Could not create notification:', e);
      }
    }

    closeLast() {
      try {
        this._lastNotification?.close?.();
        this._lastNotification = null;
      } catch {}
    }
  }

  Scratch.extensions.register(new BrowserNotify());
})(Scratch);
