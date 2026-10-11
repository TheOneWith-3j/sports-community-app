BEGIN;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY profiles_select_community_peers ON profiles FOR SELECT
  USING (
    deleted_at IS NULL AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.profile_id = auth.uid()
          AND cm2.profile_id = profiles.id
      )
      OR is_super_admin()
    )
  );

CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_super_admin_all ON profiles FOR ALL
  USING (is_super_admin());

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY communities_select_member ON communities FOR SELECT
  USING (deleted_at IS NULL AND (is_community_member(id) OR is_super_admin()));

CREATE POLICY communities_insert_authenticated ON communities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY communities_update_admin ON communities FOR UPDATE
  USING (is_community_admin(id) AND deleted_at IS NULL);

CREATE POLICY communities_soft_delete_admin ON communities FOR UPDATE
  USING (is_community_admin(id));

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY community_members_select ON community_members FOR SELECT
  USING (is_community_member(community_id) OR is_super_admin());

CREATE POLICY community_members_insert_admin ON community_members FOR INSERT
  WITH CHECK (is_community_admin(community_id) OR is_super_admin());

CREATE POLICY community_members_update_admin ON community_members FOR UPDATE
  USING (is_community_admin(community_id) OR is_super_admin());

CREATE POLICY community_members_delete_admin ON community_members FOR DELETE
  USING (is_community_admin(community_id) OR is_super_admin());

ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_types_select_all ON activity_types FOR SELECT USING (true);
CREATE POLICY activity_types_manage_super ON activity_types FOR ALL USING (is_super_admin());

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_public_select ON events FOR SELECT
  USING (deleted_at IS NULL AND status = 'published');

CREATE POLICY events_member_select ON events FOR SELECT
  USING (deleted_at IS NULL AND (is_community_member(community_id) OR is_super_admin()));

CREATE POLICY events_insert_admin ON events FOR INSERT
  WITH CHECK (is_community_admin(community_id) AND created_by = auth.uid());

CREATE POLICY events_update_admin ON events FOR UPDATE
  USING (is_community_admin(community_id) AND deleted_at IS NULL);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_participants_select ON event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = event_participants.event_id
        AND e.deleted_at IS NULL
        AND (
          e.status = 'published'
          OR is_community_member(e.community_id)
          OR is_super_admin()
        )
    )
    AND (
      status = 'confirmed'
      OR profile_id = auth.uid()
      OR is_community_admin(
        (SELECT community_id FROM events WHERE id = event_participants.event_id)
      )
      OR is_super_admin()
    )
  );

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_select_admin ON attendance_records FOR SELECT
  USING (
    is_community_admin(
      (SELECT community_id FROM events WHERE id = attendance_records.event_id)
    )
    OR is_super_admin()
  );

CREATE POLICY attendance_select_own ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM event_participants ep
      WHERE ep.id = attendance_records.participant_id
        AND ep.profile_id = auth.uid()
    )
  );

CREATE POLICY attendance_insert_admin ON attendance_records FOR INSERT
  WITH CHECK (
    is_community_admin(
      (SELECT community_id FROM events WHERE id = event_id)
    )
  );

CREATE POLICY attendance_update_admin ON attendance_records FOR UPDATE
  USING (
    is_community_admin(
      (SELECT community_id FROM events WHERE id = event_id)
    )
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select_super ON audit_logs FOR SELECT USING (is_super_admin());
CREATE POLICY audit_logs_insert_admin ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
