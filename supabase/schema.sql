-- =========================================================
-- WC PREDICT - Dünya Kupası 2026 Şirket İçi Tahmin Yarışması
-- Supabase SQL Şeması
-- Bu dosyayı Supabase Dashboard > SQL Editor içinde çalıştırın
-- =========================================================

-- ---------------------------------------------------------
-- 1. PROFILES (auth.users tablosuna ek bilgi)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  department text,
  avatar_emoji text default '⚽',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiller herkese görünür"
  on public.profiles for select
  using (true);

create policy "Kullanıcı kendi profilini güncelleyebilir"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Kullanıcı kendi profilini oluşturabilir"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Yeni kullanıcı kayıt olduğunda otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'department'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------------------------------------------------------
-- 2. TEAMS (Takımlar)
-- ---------------------------------------------------------
create table if not exists public.teams (
  id text primary key,           -- ör: 'BRA', 'ARG' (FIFA kodu)
  name text not null,
  flag_emoji text,
  group_name text                -- 'A', 'B', ... veya null (eleme aşaması öncesi belirsiz takımlar için)
);

alter table public.teams enable row level security;
create policy "Takımlar herkese görünür" on public.teams for select using (true);


-- ---------------------------------------------------------
-- 3. MATCHES (Maçlar - gruplar + eleme turları)
-- ---------------------------------------------------------
create table if not exists public.matches (
  id bigint primary key,                  -- external API match id (football-data.org vs.)
  stage text not null,                    -- 'GROUP', 'R32', 'R16', 'QF', 'SF', 'F3' (3.lük), 'FINAL'
  group_name text,                        -- grup aşamasıysa 'A'..'L'
  match_number int,                       -- turnuva maç numarası (1-104)
  home_team_id text references public.teams(id),
  away_team_id text references public.teams(id),
  home_placeholder text,                  -- eleme turunda takım henüz belirlenmemişse ör: '1A' (A grubu 1.si)
  away_placeholder text,
  match_date timestamptz not null,
  venue text,
  status text not null default 'SCHEDULED', -- SCHEDULED, LIVE, FINISHED
  home_score int,
  away_score int,
  home_score_et int,                      -- uzatma sonrası skor (varsa)
  away_score_et int,
  home_penalties int,                     -- penaltı sonucu (varsa)
  away_penalties int,
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;
create policy "Maçlar herkese görünür" on public.matches for select using (true);

create index if not exists idx_matches_stage on public.matches(stage);
create index if not exists idx_matches_date on public.matches(match_date);


-- ---------------------------------------------------------
-- 4. PREDICTIONS (Maç tahminleri)
-- ---------------------------------------------------------
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,
  predicted_home_score int not null,
  predicted_away_score int not null,
  -- eleme turlarında berabere kalırsa kazananı seçmek için (opsiyonel)
  predicted_winner_id text references public.teams(id),
  points_awarded int,                     -- maç bitince hesaplanır
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.predictions enable row level security;

create policy "Kullanıcı kendi tahminlerini görür"
  on public.predictions for select
  using (auth.uid() = user_id);

-- Maç başladıktan sonra herkesin tahminleri görünür olsun (karşılaştırma için)
create policy "Başlamış maçların tahminleri herkese görünür"
  on public.predictions for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.status <> 'SCHEDULED'
    )
  );

create policy "Kullanıcı kendi tahminini ekleyebilir"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'SCHEDULED'
      and m.match_date > now()
    )
  );

create policy "Kullanıcı kendi tahminini güncelleyebilir (maç başlamadan)"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'SCHEDULED'
      and m.match_date > now()
    )
  );

create index if not exists idx_predictions_user on public.predictions(user_id);
create index if not exists idx_predictions_match on public.predictions(match_id);


-- ---------------------------------------------------------
-- 5. CHAMPION PREDICTIONS (Şampiyon / final 4 tahmini)
-- ---------------------------------------------------------
create table if not exists public.tournament_predictions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  champion_team_id text references public.teams(id),
  runner_up_team_id text references public.teams(id),
  third_place_team_id text references public.teams(id),
  top_scorer_player text,
  locked_at timestamptz,                  -- turnuva başladığında kilitlenir
  points_awarded int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tournament_predictions enable row level security;

create policy "Kullanıcı kendi turnuva tahminini görür"
  on public.tournament_predictions for select
  using (auth.uid() = user_id);

create policy "Turnuva ba\u015flad\u0131ktan sonra herkes g\u00f6rebilir"
  on public.tournament_predictions for select
  using (locked_at is not null and locked_at < now());

create policy "Kullanıcı kendi turnuva tahminini ekleyebilir/güncelleyebilir"
  on public.tournament_predictions for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kilitlenmeden önce güncelleyebilir"
  on public.tournament_predictions for update
  using (auth.uid() = user_id and (locked_at is null or locked_at > now()));


-- ---------------------------------------------------------
-- 6. PUANLAMA FONKSİYONU
--    Doğru skor (exact): 5 puan
--    Doğru sonuç (1/X/2) ama skor yanlış: 2 puan
--    Yanlış: 0 puan
--    (Eleme turunda doğru ilerleyen takım tahmini için +1 bonus -
--     predicted_winner_id alanı ile)
-- ---------------------------------------------------------
create or replace function public.calculate_points(
  pred_home int, pred_away int,
  actual_home int, actual_away int
) returns int
language plpgsql immutable
as $$
declare
  pred_result text;
  actual_result text;
begin
  if pred_home is null or pred_away is null or actual_home is null or actual_away is null then
    return 0;
  end if;

  if pred_home = actual_home and pred_away = actual_away then
    return 5; -- tam skor
  end if;

  pred_result := case
    when pred_home > pred_away then '1'
    when pred_home < pred_away then '2'
    else 'X' end;

  actual_result := case
    when actual_home > actual_away then '1'
    when actual_home < actual_away then '2'
    else 'X' end;

  if pred_result = actual_result then
    return 2; -- doğru sonuç
  end if;

  return 0;
end;
$$;

-- Bir maç sonuçlandığında tüm tahminlerin puanını güncelleyen fonksiyon
-- (admin panelinden maç sonucu girildiğinde çağrılır)
create or replace function public.score_match(p_match_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  m record;
begin
  select * into m from public.matches where id = p_match_id;
  if m.status <> 'FINISHED' then
    return;
  end if;

  update public.predictions p
  set points_awarded = public.calculate_points(
        p.predicted_home_score, p.predicted_away_score,
        m.home_score, m.away_score
      ),
      updated_at = now()
  where p.match_id = p_match_id;
end;
$$;

-- ---------------------------------------------------------
-- 7. LEADERBOARD VIEW (Puan tablosu)
-- ---------------------------------------------------------
create or replace view public.leaderboard as
select
  pr.id as user_id,
  pr.display_name,
  pr.department,
  pr.avatar_emoji,
  coalesce(sum(p.points_awarded), 0) as match_points,
  coalesce(tp.points_awarded, 0) as tournament_points,
  coalesce(sum(p.points_awarded), 0) + coalesce(tp.points_awarded, 0) as total_points,
  count(p.id) filter (where p.points_awarded = 5) as exact_scores,
  count(p.id) filter (where p.points_awarded is not null) as predictions_scored
from public.profiles pr
left join public.predictions p on p.user_id = pr.id
left join public.tournament_predictions tp on tp.user_id = pr.id
group by pr.id, pr.display_name, pr.department, pr.avatar_emoji, tp.points_awarded
order by total_points desc, exact_scores desc;

-- Not: view'lar RLS'den dolaylı etkilenir ama select izinleri yukarıdaki tablo
-- politikalarına bağlıdır. Genel sıralama görünür olsun istiyorsanız aşağıdaki
-- gibi "security_invoker" yerine fonksiyon bazlı toplu görünüm kullanabilirsiniz.
-- Basitlik için: leaderboard sadece toplam puanı gösterdiği için tahmin
-- detaylarını ifşa etmez, bu yüzden herkese açık bir RPC ile de sunulabilir:

create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  display_name text,
  department text,
  avatar_emoji text,
  match_points bigint,
  tournament_points int,
  total_points bigint,
  exact_scores bigint,
  predictions_scored bigint
)
language sql security definer set search_path = public
as $$
  select * from public.leaderboard;
$$;


-- ---------------------------------------------------------
-- 8. ADMIN: maç sonucu girildiğinde otomatik puanlama trigger'ı
-- ---------------------------------------------------------
create or replace function public.on_match_finished()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'FINISHED' and (old.status is distinct from 'FINISHED') then
    perform public.score_match(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_match_finished on public.matches;
create trigger trg_match_finished
  after update on public.matches
  for each row execute procedure public.on_match_finished();


-- ---------------------------------------------------------
-- 9. Maçları INSERT/UPDATE edebilmek için admin politikası
--    (Service role veya admin kullanıcılar için)
-- ---------------------------------------------------------
create policy "Adminler maç ekleyebilir/güncelleyebilir"
  on public.matches for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Adminler takım ekleyebilir"
  on public.teams for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ---------------------------------------------------------
-- BİTTİ. Sıradaki adım: README.md içindeki kurulum talimatlarını izleyin.
-- ---------------------------------------------------------
