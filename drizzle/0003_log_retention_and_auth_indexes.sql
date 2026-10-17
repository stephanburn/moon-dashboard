CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "visit_log_day_idx" ON "visit_log" USING btree ("day");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_account_unique" UNIQUE("provider_id","account_id");