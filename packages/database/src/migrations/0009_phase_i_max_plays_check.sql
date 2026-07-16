-- Phase I: Enforce max_plays >= 1 at the schema level
ALTER TABLE playback_consumption
  ADD CONSTRAINT ck_playback_max_plays_positive CHECK (max_plays >= 1);
