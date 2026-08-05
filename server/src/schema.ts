import { pgTable, serial, integer, boolean, text, timestamp } from 'drizzle-orm/pg-core';

export const userSettings = pgTable('user_settings', {
  userId:            integer('user_id').primaryKey().default(0),
  numKeys:           integer('num_keys').notNull().default(88),
  showNotes:         boolean('show_notes').notNull().default(false),
  selectedGroups:    text('selected_groups').array().notNull().default(['Major']),
  sharpsFilter:      text('sharps_filter').notNull().default('with-sharps'),
  handsMode:         text('hands_mode').notNull().default('right'),
  selectedKey:       text('selected_key'),
  octaveOffsetRight: integer('octave_offset_right').notNull().default(0),
  octaveOffsetLeft:  integer('octave_offset_left').notNull().default(0),
});

export const timedResults = pgTable('timed_results', {
  id:             serial('id').primaryKey(),
  userId:         integer('user_id').notNull().default(0),
  score:          integer('score').notNull(),
  mistakes:       integer('mistakes').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  selectedGroups: text('selected_groups').array().notNull(),
  sharpsFilter:   text('sharps_filter').notNull(),
  handsMode:      text('hands_mode').notNull(),
  selectedKey:    text('selected_key'),
});
