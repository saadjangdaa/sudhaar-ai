-- Roman Urdu comment threads for reports that don't have any replies yet —
-- every real submission made while testing the app, as opposed to the
-- batch-seeded demo rows that 004_comments.sql already gave threads to.
--
-- Matched by report_id directly rather than raw_text LIKE, since real
-- submissions carry messy/test raw_text ('test', 'sadsad', 'bhauuuu') that a
-- text pattern can't reliably key off.
--
-- Safe to re-run: the seed block clears its own rows (session_id =
-- 'seed-latest') first. If you submit new reports after running this, just
-- run it again later against whatever's still missing a thread — rows that
-- already have this session_id's comments get replaced, not duplicated.

delete from public.comments where session_id = 'seed-latest';

insert into public.comments (report_id, author_name, body, session_id, created_at)
select v.report_id::uuid, v.author_name, v.body, 'seed-latest',
       now() - (v.mins_ago || ' minutes')::interval
from (
  values
    ('d5e9b783-1244-4b45-b632-f2f0213c1cc8', 'Ayesha Noor',
     'Teen Talwar wali yeh sadak sach mein bohat kharab ho chuki hai, gaadi ka silencer tak nikal gaya mera.', 55),
    ('f306dc8e-83f6-49f7-97f7-aa242d315d5c', 'Waqar Hussain',
     'Yeh kachra to hamare mohalle mein bhi kai dinon se para hai, koi utha kar nahi le gaya.', 210),
    ('e58449a5-7f91-4fa9-ac78-3c1a4902e155', 'Sana Malik',
     'Isi tarah ka kachra hamari gali ke corner par bhi jama hai, sweepers kaafi dinon se nahi aaye.', 300),
    ('b78cdc58-0dca-4c90-a474-226c6c6b59a4', 'Fahad Siddiqui',
     'Yeh manzar rozana ka hai, is ilaqe mein kachra collection ka waqt fix nahi hai.', 340),
    ('dcbcdf01-0054-4ae5-be31-418abf5d393b', 'Kiran Aslam',
     'Saddar ki yeh sadak barsat ke baad se hi aisi hai, gaddon mein paani bhar jata hai.', 400),
    ('06dca592-a86b-4319-bde1-a190c12fb3a9', 'Junaid Baig',
     'DHA mein bhi ab kachra jama hone laga hai, pehle to yahan aisa nahi hota tha.', 460),
    ('fc68140d-b0c4-4719-b171-84fdec3f194a', 'Rabia Sultana',
     'Yehi haal hamari sadak ka bhi hai, roz subah kachra phaila hota hai.', 470),
    ('c9b95605-9e80-4ee5-aa9e-e0d4896eed6f', 'Omar Farooq',
     'Yeh gaddha motorcycle walon ke liye khaas taur par khatarnak hai raat ke waqt.', 520),
    ('cf56c78a-36ca-4a54-b4b2-1861b658c7e1', 'Nida Chaudhry',
     'Sadak ki yeh halat mahinon se hai, koi marammat nahi hui ab tak.', 540),
    ('670d1729-2e23-43a8-a653-22228b0ce750', 'Hassan Raza',
     'Clifton mein yeh gaddha barish ke baad hamesha paani se bhar jata hai, andaza nahi hota gehrai ka.', 545),
    ('eaaf2617-2dd4-4e22-b326-d3466befcb0e', 'Sobia Khan',
     'Isi sadak se roz guzarti hoon, gaddha itna bada hai ke gaadi ka balance bigar jata hai.', 550),
    ('52936a90-0f88-40f7-9c79-128472e6ea39', 'Talha Mirza',
     'Yeh sadak Clifton mein sach mein kaafi kharab hai, jald marammat honi chahiye.', 600),
    ('ca5e63a6-e3c0-47f9-b349-392c23c9b57a', 'Zainab Siddiqui',
     'Gulberg ki is sadak par gaddon ki wajah se traffic bhi roz jam hota hai.', 650),
    ('eae6a3e6-0fd5-490f-8b53-2a200b9c3924', 'Bilquis Akram',
     'Saddar mein yeh gaddha hafton se hai, motorcycle walon ke liye risky hai.', 700),
    ('f97f2e6a-1582-4ed4-85ab-09ba48383d92', 'Faisal Qadir',
     'DHA/Clifton border ki yeh sadak kaafi arse se aisi hi hai, koi marammat nahi hui.', 705),
    ('924869e3-9367-421b-9ae8-1b5e7c0eb94a', 'Amna Sheikh',
     'DHA ki is sadak par gaddon ki tadaad barh gayi hai, barish ke baad aur bhi kharab ho jati hai.', 730),
    ('b3bf0b33-6a2e-444c-9075-f93d98ee3df0', 'Danish Iqbal',
     'Isi sadak se roz guzarna padta hai, gaddon ki wajah se gaadi ko nuksan pohanch raha hai.', 735),
    ('cba4a68a-c91c-4879-995d-d140802c2251', 'Mehwish Tariq',
     'Clifton ki sadkon par gaddon ka masla barh raha hai, jald tavajju di jaye.', 740),
    ('c18673ba-e616-4668-9eee-340763f2d032', 'Salman Yousuf',
     'Hassan Square wala yeh gaddha sabko pata hai, motorcycle walay aksar yahan gir jate hain.', 745),
    ('07f0174f-1021-4fd1-a811-a87dfee967d1', 'Iqra Nadeem',
     'Liaquatabad ki is sadak par bhi bara gaddha hai, traffic hazard ban chuka hai.', 748),
    ('53651ce2-01dc-4e26-9ae1-6ae2fd1759c1', 'Usman Ghani',
     'Yeh sadak hamare ilaqe mein bhi is tarah kharab hai, hadsay ka khadsha rehta hai.', 760),
    ('2bc3492e-6513-44c9-9096-b75ad3a032c9', 'Nazia Perveen',
     'Liaquatabad mein aur bhi kai jagah aisi hi sadkein hain, sab ki marammat zaroori hai.', 765),
    ('30474da7-86c2-4462-b862-95ad0047bded', 'Rizwan Malik',
     'Lyari ke market ke paas yeh sewage ka masla purana hai, badbu ki wajah se dukanein kholna mushkil hai.', 800),
    ('746bd251-7e5e-4076-99d3-384f820652d7', 'Sadia Anwar',
     'Gulshan mein bhi kachra kaafi dinon se jama hai, SSWMB ko batana chahiye.', 810),
    ('24da2536-d0ae-4bbf-801f-277e1542b818', 'Kamran Butt',
     'Isi ilaqe mein kachra kai jaghon par phaila hua hai, safai ka nizam behtar hona chahiye.', 815),
    ('9cbd0164-e20c-43a1-88aa-38f0ac76740e', 'Shazia Hameed',
     'Saddar ki sadkein bhi is waqt bohat kharab halat mein hain, jaldi tavajju di jaye.', 820),
    ('2378c942-b6da-49a2-9b6e-1aab8448e6e6', 'Adeel Khan',
     'Yehi masla hamare ghar ke saamne bhi hai, raat ko paani jama hone se hadsay ka khadsha rehta hai.', 825)
) as v(report_id, author_name, body, mins_ago)
where exists (select 1 from public.reports r where r.id = v.report_id::uuid);

select r.summary, count(c.id) as comments
from public.reports r
left join public.comments c on c.report_id = r.id
group by r.id, r.summary
order by comments asc, r.created_at desc;
