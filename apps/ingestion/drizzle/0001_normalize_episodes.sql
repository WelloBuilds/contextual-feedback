ALTER TABLE "events"
    ADD COLUMN IF NOT EXISTS "context" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "findings" (
    "id" uuid PRIMARY KEY NOT NULL,
    "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
    "pattern_type" text NOT NULL,
    "target_key" text,
    "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "affected_visitor_count" integer NOT NULL,
    "affected_session_count" integer NOT NULL,
    "episode_count" integer NOT NULL,
    "metrics" jsonb NOT NULL,
    "confidence" numeric(3, 2) NOT NULL,
    "status" text DEFAULT 'candidate' NOT NULL,
    "first_seen_at" timestamp with time zone NOT NULL,
    "last_seen_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "findings"
    ADD COLUMN IF NOT EXISTS "affected_visitor_count" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "affected_session_count" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "episode_count" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "findings"
    ALTER COLUMN "affected_visitor_count" DROP DEFAULT,
    ALTER COLUMN "affected_session_count" DROP DEFAULT,
    ALTER COLUMN "episode_count" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "findings"
    DROP COLUMN IF EXISTS "visitor_id",
    DROP COLUMN IF EXISTS "session_id";
--> statement-breakpoint
UPDATE "findings"
SET "confidence" = 0
WHERE "confidence" IS NULL;
--> statement-breakpoint
ALTER TABLE "findings" ALTER COLUMN "confidence" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "findings_workspace_pattern_target_unique"
    ON "findings" ("workspace_id", "pattern_type", "target_key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "episodes" (
    "id" uuid PRIMARY KEY NOT NULL,
    "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id"),
    "visitor_id" uuid NOT NULL,
    "session_id" uuid NOT NULL,
    "pattern_type" text NOT NULL,
    "target_key" text,
    "status" text DEFAULT 'active' NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "last_occurred_at" timestamp with time zone NOT NULL,
    "detected_at" timestamp with time zone NOT NULL,
    "closed_at" timestamp with time zone,
    "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "event_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
    IF to_regclass('public.rage_click_episodes') IS NOT NULL THEN
        EXECUTE $migration$
            INSERT INTO "episodes" (
                "id", "workspace_id", "visitor_id", "session_id", "pattern_type",
                "target_key", "status", "started_at", "last_occurred_at", "detected_at",
                "closed_at", "metrics", "evidence", "event_ids", "created_at"
            )
            SELECT
                "id", "workspace_id", "visitor_id",
                COALESCE(
                    "session_id",
                    (SELECT "session_id" FROM "events"
                     WHERE "id" = NULLIF("event_ids" ->> 0, '')::uuid)
                ),
                'rage_clicks',
                "target_key", 'closed', "started_at", "ended_at", "created_at",
                "created_at", jsonb_build_object('clickCount', "click_count"),
                '{}'::jsonb, "event_ids", "created_at"
            FROM "rage_click_episodes"
            WHERE COALESCE(
                "session_id",
                (SELECT "session_id" FROM "events"
                 WHERE "id" = NULLIF("event_ids" ->> 0, '')::uuid)
            ) IS NOT NULL
            ON CONFLICT ("id") DO NOTHING
        $migration$;
        DROP TABLE "rage_click_episodes";
    END IF;
END $$;
--> statement-breakpoint
UPDATE "findings" AS finding
SET
    "affected_visitor_count" = COALESCE(episode_summary.visitor_count, 0),
    "affected_session_count" = COALESCE(episode_summary.session_count, 0),
    "episode_count" = COALESCE(episode_summary.episode_count, 0),
    "metrics" = jsonb_build_object(
        'totalClickCount', COALESCE(episode_summary.total_click_count, 0),
        'averageClicksPerSecond', COALESCE(episode_summary.average_clicks_per_second, 0)
    ),
    "evidence" = (finding."evidence" - 'sampleVisitorIds') || jsonb_build_object(
        'episodeIds', COALESCE(episode_summary.episode_ids, '[]'::jsonb),
        'visitorIds', COALESCE(episode_summary.visitor_ids, '[]'::jsonb)
    )
FROM LATERAL (
    SELECT
        COUNT(DISTINCT episode."visitor_id") AS visitor_count,
        COUNT(DISTINCT episode."session_id") AS session_count,
        COUNT(*) AS episode_count,
        COALESCE(SUM((episode."metrics" ->> 'clickCount')::integer), 0) AS total_click_count,
        COALESCE(AVG(
            (episode."metrics" ->> 'clickCount')::numeric /
            GREATEST(EXTRACT(EPOCH FROM (episode."last_occurred_at" - episode."started_at")), 1)
        ), 0) AS average_clicks_per_second,
        COALESCE(JSONB_AGG(episode."id"), '[]'::jsonb) AS episode_ids,
        COALESCE(JSONB_AGG(DISTINCT episode."visitor_id"), '[]'::jsonb) AS visitor_ids
    FROM "episodes" AS episode
    WHERE episode."workspace_id" = finding."workspace_id"
      AND episode."pattern_type" = finding."pattern_type"
      AND episode."target_key" IS NOT DISTINCT FROM finding."target_key"
      AND episode."id"::text IN (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(finding."evidence" -> 'episodeIds')
      )
) AS episode_summary
WHERE finding."pattern_type" = 'rage_clicks';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episodes_active_lookup_idx"
    ON "episodes" ("workspace_id", "visitor_id", "pattern_type", "target_key", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episodes_aggregation_idx"
    ON "episodes" ("workspace_id", "pattern_type", "target_key", "status", "started_at");
