create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  google_place_id text,
  access_token text,
  created_at timestamptz not null default now(),
  unique (business_id, google_place_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  review_text text not null,
  review_date timestamptz not null,
  sentiment text check (sentiment in ('Positive', 'Neutral', 'Negative')),
  draft_response text,
  status text not null default 'PENDING_REVIEW'
    check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  constraint reviews_sentiment_matches_rating check (
    sentiment is null
    or (rating between 1 and 2 and sentiment = 'Negative')
    or (rating = 3 and sentiment = 'Neutral')
    or (rating between 4 and 5 and sentiment = 'Positive')
  )
);

create index locations_business_id_idx on public.locations (business_id);
create index reviews_location_status_date_idx
  on public.reviews (location_id, status, review_date desc);

alter table public.businesses enable row level security;
alter table public.locations enable row level security;
alter table public.reviews enable row level security;

revoke all on table public.businesses, public.locations, public.reviews
  from anon, authenticated;

grant select, insert, update, delete on table public.businesses to authenticated;
grant select (id, business_id, name, google_place_id, created_at),
  insert (business_id, name, google_place_id),
  update (business_id, name, google_place_id),
  delete on table public.locations to authenticated;
grant select, update on table public.reviews to authenticated;

create policy "Business owners can manage their businesses"
  on public.businesses
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Business owners can manage their locations"
  on public.locations
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.businesses
      where businesses.id = locations.business_id
        and businesses.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.businesses
      where businesses.id = locations.business_id
        and businesses.owner_id = (select auth.uid())
    )
  );

create policy "Business owners can review their location reviews"
  on public.reviews
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.locations
      join public.businesses on businesses.id = locations.business_id
      where locations.id = reviews.location_id
        and businesses.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.locations
      join public.businesses on businesses.id = locations.business_id
      where locations.id = reviews.location_id
        and businesses.owner_id = (select auth.uid())
    )
  );