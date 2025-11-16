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
- [x] i want a plugin, that will be used to generate top quality pictures with genai, like wan2 or veo3, i havent thought about it. but the flow is like, admin will upload multiple images, a dropdown that can add `category` and a prompt, both category and prompt will come from frontend, so some generics prompt will be there in frontend code. there will be a modal, multiple images will be uploaded or videos. data will be like this that will be recieved by backend.
{ category: '', prompt: '', medias: [{data, mimetype}, {}, ......] }
- [x] backend wont immediately process it, rather it will store it in database, with proper references. of medias and mime and category and prompt, in docker tehre is a volume mentioned backend-data
- processing will happen in pipelines, basically pipelines are functions stage1 -> func(initial_data): output1 -> function(output1): output2 -> .... make this dynamic so that there is a manager.
- [x] for now setup this pipeline in a folder under core/genai/tryons/processors stage1.go ... stageN.go
- [x] folder strcutures core/genai/tryons/ -> <tryons>/resources/controller.go,models.go,repository.go,service.go to store medias and view medias and state, is it processed or pending or error, retry too, incase the output is bad.
- [x] after uploading a media, the processor pipeline will get trigger, it will take data dn pass to stage1, that will call some 3rd party apis, for now just fmt.Println it, later i will do the actual api calls. i want proper db models to store and track states.


## fixes later
- [ ] service discovery so that, if one instance is down, other instance will handle, currently realtime microservice depends on backend1