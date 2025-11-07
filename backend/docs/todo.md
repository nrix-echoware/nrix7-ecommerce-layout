## basic coding practices guidelines

use solid principals
use design principals
use state manager for all data storing operations, if the data is persisted then use redux toolkit
this is both mobile and desktop app, so the mobile version has to mimic similar to whatsapp
after every code iterations update the todo, to check mark what is done, add new tasks based on the task tracker status
run linter update fixes
fix issues then update the todo and run again the cycle of coding, when everything is done put it inside the complete tracker
make sure this frontend app is following all the best practice

## completed
- [x] the chat service is stopping the backend to be 100% distributed, its stateful nature is making it hard to make things distributed. so create a separate microservice, keep every logic here, so this backend will run n number of copies of itself, and user will be connected to any istance, if there is anything generated, like any sse event in this controller

adminRoutes.GET("/sse", ctrl.AdminSSE)
userRoutes.GET("/sse/notification/:user_id", ctrl.UserSSE)

then what these backend instance will do is use grpc to send it to a new microservice, that will make handle this sse notifications, users will connect to this. this will ensure my core backend is distributed and only notification is taken care by a different service, later this notification i will do distributed, but for now its more than enough.

- [x] same for websockets as well, its not related to core service, put this also in realtime backend module, users gets connected to it, as a centralized system, if core system has to trigger it, then user -> core_system (internal grpc) -> realtime (ws module), this realtime(ws) will send user the data. thats all.

## fixes
- [x] its inside the backend still, no way its separated app
- [x] there are duplicate things which needs to be fixed.
- [x] core will run n number of instance, so it wont have sse or websocket connections things, else it will be stateful 
- [x] only realtime system will be stateful, it will be a total different independent application, all instances will connect it via docker network. and users will also connect to it, for now its just one instance.
- [x] i dont want duplicate code in my codebase.fix it.

## todo
- [x] i dont see a docker for realtime microservice. for now 2 backend will run a nginx load balancer, and frontend will connect via this loadbalancer nginx, to any 1 instance or request go to whosoever backend i dont care, but realtime microserivice will also be run separatetly and forntend will connect to it, and rest flow will be same.
- [x] do the loadbalancer and other things, so there will be 1 nginx, 2 backend 1 realtime, and frontend will connect to nginx loadbalancer or server and stateless routes will go to any instance and it will work, if there is an event generate a grpc event and send it to realtime.
- [x] make things distributed. so that the orchastration is done smoothly.
- [x] this endpoint hitting is wrong, it should hit realtime microservice and bind the connection there, and from core, when message goes it will go via grpc to realtime microservice that i have, and then it will be broadcast to the users, whosoever listens on that specific link will get that, and there are auth as well, for two, one is admin api key, and another is user jwt, for jwt it will do a grpc call and verify with the actual backend. simple, first put this in to do, as unchecked
- [x] make a ping req and res test, when backend starts, fire 10 ping pong request, realtime will ask 10 times, that will responsed by the backend, 10 times because nginx round robins things, so logging will also clear it, and it will be better to check grpc in action.