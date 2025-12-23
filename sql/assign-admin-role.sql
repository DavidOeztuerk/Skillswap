-- =============================================================================
-- SQL Script: Admin-Rolle dem aktuellen User zuweisen
-- =============================================================================
-- Dieses Script weist dem zuletzt registrierten User die Admin-Rolle zu
--
-- AUSFÜHREN MIT:
-- psql -h localhost -p 5432 -U skillswap -d skillswap_userservice -f assign-admin-role.sql
-- ODER: psql -h localhost -p 5432 -U postgres -d skillswap_userservice -f assign-admin-role.sql
-- =============================================================================

-- Admin-Rolle-ID (aus InitialCreate Migration)
-- 550e8400-e29b-41d4-a716-446655440002 = Admin
-- 550e8400-e29b-41d4-a716-446655440001 = SuperAdmin

DO $$
DECLARE
    v_user_id UUID;
    v_admin_role_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    v_user_email VARCHAR;
BEGIN
    -- Hole den zuletzt registrierten User
    SELECT "Id", "Email"
    INTO v_user_id, v_user_email
    FROM "Users"
    ORDER BY "CreatedAt" DESC
    LIMIT 1;

    -- Prüfe ob User gefunden wurde
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'FEHLER: Kein User in der Datenbank gefunden!';
        RETURN;
    END IF;

    RAISE NOTICE 'User gefunden: % (ID: %)', v_user_email, v_user_id;

    -- Prüfe ob User bereits Admin-Rolle hat
    IF EXISTS (
        SELECT 1
        FROM "UserRoles"
        WHERE "UserId" = v_user_id
          AND "RoleId" = v_admin_role_id
          AND "RevokedAt" IS NULL
    ) THEN
        RAISE NOTICE 'User % hat bereits die Admin-Rolle!', v_user_email;
        RETURN;
    END IF;

    -- Füge Admin-Rolle hinzu
    INSERT INTO "UserRoles" ("UserId", "RoleId", "AssignedAt", "AssignedBy", "RevokedAt")
    VALUES (v_user_id, v_admin_role_id, NOW(), 'system', NULL);

    RAISE NOTICE '✅ Admin-Rolle erfolgreich zugewiesen an: %', v_user_email;

    -- Zeige alle Rollen des Users
    RAISE NOTICE 'Alle Rollen des Users:';
    FOR v_user_email IN
        SELECT r."Name"
        FROM "UserRoles" ur
        JOIN "Roles" r ON ur."RoleId" = r."Id"
        WHERE ur."UserId" = v_user_id
          AND ur."RevokedAt" IS NULL
    LOOP
        RAISE NOTICE '  - %', v_user_email;
    END LOOP;

END $$;

-- Optionales Cleanup: Zeige alle Users mit ihren Rollen
SELECT
    u."Email",
    u."FirstName",
    u."LastName",
    STRING_AGG(r."Name", ', ') AS "Rollen"
FROM "Users" u
LEFT JOIN "UserRoles" ur ON u."Id" = ur."UserId" AND ur."RevokedAt" IS NULL
LEFT JOIN "Roles" r ON ur."RoleId" = r."Id"
GROUP BY u."Id", u."Email", u."FirstName", u."LastName"
ORDER BY u."CreatedAt" DESC
LIMIT 10;
