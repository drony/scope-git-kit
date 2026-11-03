import { prop, type ContestDoc } from './define.ts'

export const communicationDocs: ContestDoc[] = [
  {
    id: 'announcement-composer',
    name: 'AnnouncementComposer',
    group: 'communication',
    summary: 'The form for one announcement: title and message with merge fields, who gets it (with a live count), which channels, and when. It saves and sends nothing.',
    source: 'contest/components/AnnouncementComposer.tsx',
    props: [
      prop('value', 'Announcement', 'The announcement being written.', { required: true }),
      prop('onChange', '(announcement: Announcement) => void', 'Called with the whole updated announcement.', { required: true }),
      prop('participants', 'Participant[]', 'Everyone in the contest. The audience is counted from this list.', { required: true }),
      prop('submissions', 'Submission[]', 'Needed for audiences that depend on progress ("not started", "finished").'),
      prop('onSend', '() => void', 'Shows a "Send now" button. It is called only when nothing is wrong; save the draft first.'),
      prop('now', 'Date', 'Replaces the clock, for tests and demos.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<AnnouncementComposer
  value={draft}
  onChange={setDraft}
  participants={people}
  submissions={submissions}
  onSend={() => void sendNow()}
/>`,
    notes: [
      'The "Insert" chips add `{{name}}`, `{{team}}` or `{{contest}}` at the cursor of the field you last used. An unknown field such as `{{nmae}}` is reported before sending.',
      'The count under "Who gets it" comes from `audienceOf`, the same function the backend uses, so it cannot disagree with what is sent.',
      'A sent announcement is shown read-only. `announcementProblems` lists what stops a send.',
    ],
  },
  {
    id: 'channel-preview',
    name: 'ChannelPreview',
    group: 'communication',
    summary: 'The same announcement as each channel shows it: a notification in the app, an e-mail, and a push on a lock screen.',
    source: 'contest/components/ChannelPreview.tsx',
    props: [
      prop('title', 'string', 'The announcement title, with merge fields.', { required: true }),
      prop('body', 'string', 'The message, with merge fields.', { required: true }),
      prop('channels', "Array<'in-app' | 'email' | 'push'>", 'The channels in use; each one gets a tab.', { required: true }),
      prop('contest', 'string', 'Name shown as the sender, and the value of `{{contest}}`.', { default: "'Contest'" }),
      prop('vars', 'TemplateVars', 'Values for the merge fields. They default to a sample person.'),
      prop('channel', "'in-app' | 'email' | 'push'", 'The tab shown. Leave out to let the preview keep it.'),
      prop('onChannelChange', '(channel: Channel) => void', 'Called when another tab is chosen.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<ChannelPreview title={draft.title} body={draft.body} channels={draft.channels} contest={contest.title} />`,
    notes: ['Merge fields are filled with a sample person ("Ada", "Comets"). Unknown fields stay as typed, which makes a typo easy to see.'],
  },
  {
    id: 'delivery-status',
    name: 'DeliveryStatus',
    group: 'communication',
    summary: 'After an announcement is sent: per channel, how many people it reached, how many it missed, and why.',
    source: 'contest/components/DeliveryStatus.tsx',
    props: [
      prop('delivery', 'Announcement["delivery"]', 'The `delivery` of a sent announcement. Renders nothing when it is empty.', { required: true }),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `{announcement.status === 'sent' && <DeliveryStatus delivery={announcement.delivery} />}`,
  },
  {
    id: 'announcement-feed',
    name: 'AnnouncementFeed',
    group: 'communication',
    summary: 'What a participant reads: the announcements that were sent, pinned ones first, then the newest.',
    source: 'contest/components/AnnouncementFeed.tsx',
    props: [
      prop('announcements', 'Announcement[]', 'All announcements. Only the sent ones are shown.', { required: true }),
      prop('vars', 'TemplateVars', "The reader's own values for the merge fields (name, team, contest)."),
      prop('now', 'Date', 'Replaces the clock, for tests and demos.'),
      prop('className', 'string', 'Extra classes.'),
    ],
    example: `<AnnouncementFeed announcements={announcements} vars={{ name: 'Kai', team: 'Orbit', contest: 'Aurora Cup' }} />`,
  },
  {
    id: 'notification-center',
    name: 'NotificationCenter',
    group: 'communication',
    summary: 'A bell with the number of unread notifications. It opens a panel with the notifications grouped by day. NotificationItem is one row of it, also used in previews.',
    source: 'contest/components/NotificationCenter.tsx',
    exports: ['NotificationCenter', 'NotificationItem'],
    imports: ['NotificationCenter'],
    props: [
      prop('notifications', 'Notification[]', "One person's notifications.", { required: true }),
      prop('onRead', '(ids: string[]) => void', 'Called with the ids that were just read: one when an item is opened, all unread ones for "Mark all as read".', { required: true }),
      prop('onOpen', '(notification: Notification) => void', 'Called when an item that has a link (`href`) is opened. The panel closes.'),
      prop('now', 'Date', 'Replaces the clock, for tests and demos.'),
      prop('className', 'string', 'Extra classes for the panel.'),
    ],
    example: `const notes = useNotifications(me.id)

<NotificationCenter
  notifications={notes.data ?? []}
  onRead={(ids) => void notes.markRead(ids)}
  onOpen={(n) => navigate(n.href!)}
/>`,
    notes: [
      '`NotificationItem` takes `notification`, `onSelect` (makes it a button) and `now`.',
      'The bell label says how many are unread, for screen readers. The panel opens with the keyboard and closes with Esc.',
      '`useNotifications` asks again every few seconds, so news sent from the back office shows up without a reload.',
    ],
  },
]
