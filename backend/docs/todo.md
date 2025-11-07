## basic coding practices guidelines

use solid principals
use design principals
use state manager for all data storing operations, if the data is persisted then use redux toolkit
this is both mobile and desktop app, so the mobile version has to mimic similar to whatsapp
after every code iterations update the todo, to check mark what is done, add new tasks based on the task tracker status
run linter update fixes
fix issues then update the todo and run again the cycle of coding, when everything is done put it inside the complete tracker
make sure this frontend app is following all the best practice

## todo
- [x] i want postgres instead of sqlite, need a docker setup for that
- [x] all sqlite things will be replaced with postgres
- [x] make sure all the env files are controlled properly via docker env
- [x] .env file needs to work with frontend, so that fronend uses `import meta.` for apis
- [x] data folder sharing will common between backend services, so that instance 1 will know instance 2 uploads this can be done via docker itself.
- [x] i dont want useless duplicate code, plugin manager isnt needed, it has to go away, no bogus or duplicate code allowed in my code base.
- [x] check for core resources, specifically controllers, services and repository, so that things can be fixed.
- [x] the more stateless the codebase is, the best things will be, the backend1 will start first, backend2 will start later, else it both will try to migrate the database, that will be an issue, that needs to be fixed.
- [x] i dont need jwt auth verification to be with grpc, jwt secret can be shared, i can decode it, without depending on backend, i am talking inside realtime microservice, this way both will be independent. remove the jwt dependency current have, realtime microservice calls backend with token and get the details, dont use that, decode it in  realtime microservice itself, just share the keys from docker, that will do it.
- [x] i dont want duplicate code, is this needed, cause realtime microservice can decode the jwt now, is this neeeded.
- [x] the proto needs to be updated for whole microservices as well, i want consistency and totally clean code. i dont want anything dangling in my code.



## fixes later
- [ ] service discovery so that, if one instance is down, other instance will handle, currently realtime microservice depends on backend1