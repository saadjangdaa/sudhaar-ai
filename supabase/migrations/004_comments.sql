-- Citizen comments on a complaint, plus Roman Urdu sample threads on the demo rows.
--
-- Comments were out of scope in the original plan; this adds the smallest table
-- that supports the thing the feed was always implying — that neighbours corroborate
-- each other's reports. An authority reading "42 upvotes" learns far less than one
-- reading four people saying the drain has been open for a week.
--
-- Run AFTER supabase/seed_demo.sql. comments.report_id cascades on delete, and
-- seed_demo.sql begins by deleting every '[demo]%' report — so re-running that
-- file removes these comments and this one has to be re-run behind it.
--
-- Safe to re-run on its own: the seed block clears its own rows first.

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  author_name text not null,
  body        text not null,
  -- Same anonymous localStorage id the upvote RPC uses. Demo rows carry the
  -- literal 'demo-seed' so this file can find and replace exactly its own rows.
  session_id  text,
  created_at  timestamptz not null default now(),
  constraint comments_body_len   check (char_length(body) between 1 and 1000),
  constraint comments_author_len check (char_length(author_name) between 1 and 60)
);

create index if not exists comments_report_idx
  on public.comments (report_id, created_at);

alter table public.comments enable row level security;

-- Readable by anyone, like reports — the thread is the public part of the point.
drop policy if exists "comments are publicly readable" on public.comments;
create policy "comments are publicly readable"
  on public.comments for select
  using (true);

-- Writable from the browser with the anon key.
--
-- This is a deliberate, bounded exception to the rule that the browser never
-- writes to Postgres. Upvotes go through a security-definer RPC because a raw
-- insert would let one person vote a thousand times; a comment carries the same
-- spam exposure as the report-media bucket, which already accepts anon uploads.
-- The length CHECKs above are the guard, and there is no update or delete policy,
-- so a posted comment cannot be edited or removed from the browser.
drop policy if exists "anyone can post a comment" on public.comments;
create policy "anyone can post a comment"
  on public.comments for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Sample threads, in Roman Urdu, on each seeded demo complaint.
--
-- Written as neighbours actually reply: corroborating a detail, adding one the
-- original report missed, or saying it is still not fixed. A thread of four
-- agreements would read as filler.
-- ---------------------------------------------------------------------------

delete from public.comments where session_id = 'demo-seed';

with target as (
  select id, raw_text from public.reports where raw_text like '[demo]%'
),
sample (match, author, body, mins_ago) as (
  values
    -- pothole, Gulshan-e-Iqbal
    ('%pothole outside the main gate%', 'Imran Ahmed',
     'Yehi gaddha pichle mahine meri bike ka tyre phaar chuka hai. Raat ko to bilkul nazar nahi aata.', 2870),
    ('%pothole outside the main gate%', 'Saima Rizvi',
     'Barish ke baad paani bhar jata hai aur gehrai ka andaza hi nahi hota. Koi nishaan tak nahi lagaya gaya.', 1640),
    ('%pothole outside the main gate%', 'Bilal Shaikh',
     'Rickshaw wale bhi yahan se bach kar nikalte hain, isi wajah se saamne wali lane mein jam lag jata hai.', 720),

    -- sewage, Lyari
    ('%Sewage has been overflowing%', 'Farhan Qureshi',
     'Teen din nahi, poora hafta ho gaya hai. Badbu ki wajah se khidki kholna muhaal hai.', 3300),
    ('%Sewage has been overflowing%', 'Nusrat Bano',
     'Bachay isi gande paani se guzar kar school jate hain. Do gharon mein pait ki bimari phail chuki hai.', 2100),
    ('%Sewage has been overflowing%', 'Abdul Rehman',
     'Hum ne teen baar shikayat darj karai, har baar kaha gaya amla aa raha hai. Aaj tak koi nahi aaya.', 900),

    -- garbage, North Nazimabad
    ('%Garbage has not been collected%', 'Huma Saleem',
     'Do hafte nahi, mahina hone ko hai. Aawara kuttay raat ko saara kachra gali mein phaila dete hain.', 4100),
    ('%Garbage has not been collected%', 'Tariq Mahmood',
     'Garmi mein badbu naqabil-e-bardasht ho jati hai aur machhar boht barh gaye hain.', 2600),

    -- water, Korangi
    ('%No water supply in the entire lane%', 'Zubaida Khatoon',
     'Tanker wale teen hazaar ka tanker aath hazaar mein de rahe hain. Yeh khuli loot hai.', 3900),
    ('%No water supply in the entire lane%', 'Kashif Anwar',
     'Peer se aik qatra nahi aaya. Peene ka paani bottlon mein khareedna par raha hai.', 1800),
    ('%No water supply in the entire lane%', 'Nadeem Iqbal',
     'Saath wali gali mein supply chal rahi hai, to masla line ka nahi lagta. Valve check karaya jaye.', 640),

    -- encroachment, Saddar
    ('%Footpath completely encroached%', 'Rehana Parveen',
     'Footpath par thelay lag jane se paidal chalna namumkin hai. Buzurg aur khawateen sarak par chalne par majboor hain.', 5200),
    ('%Footpath completely encroached%', 'Asad Jamal',
     'Pichle saal bhi hataye gaye thay, do din baad sab wapas aa gaye. Mustaqil hal chahiye.', 2400),

    -- storm drain, Clifton
    ('%Broken storm drain cover%', 'Shahzeb Ali',
     'Raat ko wahan roshni bhi nahi. Khuda na khwasta koi bacha gir gaya to zimmedar kaun hoga?', 2900),
    ('%Broken storm drain cover%', 'Maryam Farooqi',
     'Main ne filhal eenten rakh kar nishaan bana diya hai take log bach kar niklein, magar yeh hal nahi.', 1500),

    -- sewage, Malir (the report itself is in Urdu script)
    ('%سڑک پر گندے پانی%', 'Yasmin Akhtar',
     'Hamari gali mein bhi bilkul yehi soorat-e-haal hai. Sab se zyada mushkil school jane wale bachon ko hoti hai.', 3400),
    ('%سڑک پر گندے پانی%', 'Muhammad Saleem',
     'Cantonment Board ko tehreeri darkhwasten di ja chuki hain, jawab koi nahi aaya.', 1200),

    -- open burning, Landhi
    ('%Rubbish being burned in the open%', 'Adnan Yousuf',
     'Shaam ko dhuan itna hota hai ke dama ke mareezon ka saans lena mushkil ho jata hai.', 2200),
    ('%Rubbish being burned in the open%', 'Shahida Begum',
     'Khulay mein kachra jalana qanoonan mana hai, iske bawajood rozana hota hai aur koi poochne wala nahi.', 800)
)
insert into public.comments (report_id, author_name, body, session_id, created_at)
select t.id,
       s.author,
       s.body,
       'demo-seed',
       now() - (s.mins_ago || ' minutes')::interval
  from sample s
  join target t on t.raw_text like s.match;

select r.summary, count(c.id) as comments
from public.reports r
left join public.comments c on c.report_id = r.id
where r.raw_text like '[demo]%'
group by r.id, r.summary
order by comments desc;
