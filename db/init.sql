CREATE TABLE user_settings (
  user_id             INTEGER  PRIMARY KEY DEFAULT 0,
  num_keys            INTEGER  NOT NULL DEFAULT 88,
  show_notes          BOOLEAN  NOT NULL DEFAULT false,
  selected_groups     TEXT[]   NOT NULL DEFAULT '{Major}',
  sharps_filter       TEXT     NOT NULL DEFAULT 'with-sharps',
  hands_mode          TEXT     NOT NULL DEFAULT 'right',
  octave_offset_right INTEGER  NOT NULL DEFAULT 0,
  octave_offset_left  INTEGER  NOT NULL DEFAULT 0
);

CREATE TABLE timed_results (
  id              SERIAL      PRIMARY KEY,
  user_id         INTEGER     NOT NULL DEFAULT 0,
  score           INTEGER     NOT NULL,
  mistakes        INTEGER     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selected_groups TEXT[]      NOT NULL,
  sharps_filter   TEXT        NOT NULL,
  hands_mode      TEXT        NOT NULL
);

CREATE INDEX ON timed_results (user_id, sharps_filter, hands_mode);

INSERT INTO user_settings (user_id) VALUES (0);
