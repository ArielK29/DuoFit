# DuoFit: handling reports (Apple guideline 1.2, "timely responses")

Apple asks for a way to report content and **timely responses to concerns**. The app already stores reports (`content_reports`: posts, comments and group messages; members can be blocked). This page is the routine for answering them. It is a proposal for the owner (checklist A-3f): the numbers can change, but they must be real, because the reviewer may ask.

## Proposed commitments
| Rule | Proposal |
|---|---|
| Who looks | The owner (later a named helper). |
| How often | Once a day while the app is in App Review and for the first month; at least twice a week afterwards. |
| Response time | Reports about abuse, hate or threats: removed within 24 hours. Everything else: within 72 hours. |
| What is done | Remove the content, and if the same member is reported again, block the account (steps below). |
| Where reports come from | The in-app report button, and the support e-mail once it exists (A4). |

The app hides content by itself in two cases: the reporter no longer sees it at once, and after **three different reports** nobody sees it. So a missed day does not leave harmful content visible for everybody.

## 1. See the reports of the last 7 days
Supabase dashboard, project `wtheyjuqpidgrgehplgw`, SQL Editor. Read only. **The `private_message` lines work only after the migration `20261020_chat_block_and_report.sql` is applied** (until then the query fails on `r.message_id`: delete the `left join public.messages d` line, the `d.body` and `d.sender_id` parts and the `r.message_id` part, or ask Claude to apply the migration first).

```sql
select
  r.created_at,
  r.reason,
  case when r.post_id is not null then 'post' when r.comment_id is not null then 'comment' when r.group_message_id is not null then 'group_message' else 'private_message' end as kind,
  coalesce(p.body, c.body, g.body, d.body) as reported_text,
  coalesce(p.user_id, c.user_id, g.sender_id, d.sender_id) as author_id,
  count(*) over (partition by coalesce(r.post_id, r.comment_id, r.group_message_id, r.message_id)) as reports_on_this_item
from public.content_reports r
left join public.posts p on p.id = r.post_id
left join public.comments c on c.id = r.comment_id
left join public.group_messages g on g.id = r.group_message_id
left join public.messages d on d.id = r.message_id
where r.created_at > now() - interval '7 days'
order by r.created_at desc;
```

Reasons are `spam`, `abuse`, `inappropriate`, `other`. A line with `reports_on_this_item` of 3 or more is already hidden from everybody.

## 2. Remove a post, comment, group message or private message
Copy the id from the report (add `r.post_id, r.comment_id, r.group_message_id` to the select if you need it), then run ONE of these in the SQL Editor. This cannot be undone, so read the text first.

```sql
delete from public.posts          where id = '<post id>';
delete from public.comments       where id = '<comment id>';
delete from public.group_messages where id = '<group message id>';
delete from public.messages       where id = '<private message id>';
```

Deleting the content also deletes the reports about it (they cascade). Write one line in your own log (date, kind, reason, what you did) before deleting: that is your proof of a timely response.

## 3. Block a member who keeps breaking the rules
Dashboard, Authentication, Users: find the member by the `author_id`, open the menu and choose **Ban user**. The member can no longer sign in. Do not delete the account unless the member asks (deletion is available inside the app).

## 4. Private (one-to-one) messages
Once the migration is applied, the person who RECEIVES a private message can tap it and choose "report and hide" (it disappears for the reporter at once; there is no automatic hiding for everybody, because only two people are in the chat), or block the sender: a block hides the whole chat from both sides and nobody can write into it until it is unblocked. Reports of private messages show up in the query above with kind `private_message`: read the text, decide, and use the delete or ban steps. Only reported messages are ever read: do not read other members' private messages for any other reason. The privacy text should say that a reported private message becomes visible to us (a question for the lawyer, see docs/LEGAL-REVIEW-PACKAGE.md).

## What is not built (and why it is fine for version 1)
- No e-mail alert when a report arrives (it needs a mail service and the domain, A3 and A4). The daily look above replaces it.
- No admin screen. Everything is done in the Supabase dashboard.
