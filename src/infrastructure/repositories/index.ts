import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseConstitutionalActionRepository } from "./SupabaseConstitutionalActionRepository";
import { SupabaseUserRepository } from "./SupabaseUserRepository";
import { SupabaseChatRepository } from "./SupabaseChatRepository";
import { SupabaseEventRepository } from "./SupabaseEventRepository";
import { SupabaseAttachmentRepository } from "./SupabaseAttachmentRepository";
import { SupabaseCatalogRepository } from "./SupabaseCatalogRepository";
import { SupabaseMeetupRepository } from "./SupabaseMeetupRepository";
import type { IConstitutionalActionRepository } from "@/core/repositories/IConstitutionalActionRepository";
import type { IUserRepository } from "@/core/repositories/IUserRepository";
import type { IChatRepository } from "@/core/repositories/IChatRepository";
import type { IEventRepository } from "@/core/repositories/IEventRepository";
import type { IAttachmentRepository } from "@/core/repositories/IAttachmentRepository";
import type { IMeetupRepository } from "@/core/repositories/IMeetupRepository";
import type { ICatalogRepository } from "@/core/repositories/ICatalogRepository";

export interface Repositories {
  actions: IConstitutionalActionRepository;
  users: IUserRepository;
  chat: IChatRepository;
  events: IEventRepository;
  attachments: IAttachmentRepository;
  meetups: IMeetupRepository;
  catalog: ICatalogRepository;
}

export function createRepositories(supabase: SupabaseClient): Repositories {
  return {
    actions: new SupabaseConstitutionalActionRepository(supabase),
    users: new SupabaseUserRepository(supabase),
    chat: new SupabaseChatRepository(supabase),
    events: new SupabaseEventRepository(supabase),
    attachments: new SupabaseAttachmentRepository(supabase),
    meetups: new SupabaseMeetupRepository(supabase),
    catalog: new SupabaseCatalogRepository(supabase),
  };
}
