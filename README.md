<!-- This is the Web App of Royal Academy -->

<!-- We are using: -->

Next.js App router mode
Postgresql as the database
prisma to connect project to postgresql locally
pgAdmin4 as the GUI for postgresql database
tailwind for css

<!-- How the team colaborate: -->

https://trello.com

<!-- Push Commands: -->

making a new branch with:
git checkout -b "name of the branch"
git add .
git commit -m "name of the commition"
git push
it throws an error:
do what error suggests

after commiting and pushing GO to github
got to your branch that you made for pushing
make a pull request
in reviewers assign reviewing to fatmadali94 or gulfDev
then wait till approvement
when approved:
merge the branch by clicking on merge button (green)

<!-- what others should do to get the latest changes from github: -->

git push origin main

<!-- Useful prisma commands -->

npx prisma db seed # run the seed
npx prisma migrate reset # wipe database + re-migrate + re-seed automatically
npx prisma studio # visual browser for your data

<!-- after changing the schema.prisma for making changes in database do: -->

npx prisma migrate dev --name set-verified-default-true
