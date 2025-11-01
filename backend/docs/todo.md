## basic coding practices guidelines

use solid principals
use design principals
use state manager for all data storing operations, if the data is persisted then use redux toolkit
this is both mobile and desktop app, so the mobile version has to mimic similar to whatsapp
after every code iterations update the todo, to check mark what is done, add new tasks based on the task tracker status
run linter update fixes
fix issues then update the todo and run again the cycle of coding, when everything is done put it inside the complete tracker
make sure this frontend app is following all the best practice

## in progress
- [x] the media in messages, doesnt store a mimetype, so restrict in endpoint for only pictures, and for uploading also restrict it to be just picture. so that doesnt matter what kind of picture <img src=blob> will render it.
- [x] very huge problem, in controllers, for all resources, there is custom and repetative implementation of jwt extraction and jwt validation for users, and rootkey validation for routes. everything is fine, but these things needs to be unified, so it needs to be fixed.
- [x] when a new order is generated, generate a server side event to notify the admin
- [x] for now disable the plugin_manager for discord and other, its not needed yet. keep the code, but dont let it reflect on http server in main.go
- [x] keep the code base clean no documentation needed, docs is manually done. so its not an issue.


## in progress fixes
- [x] add is_active to both product and variants, to mark if the product and its variant is active or not
- [x] make sure is_active for produtcs can be updated via admin section
- [x] for users view make sure is_active is properly handled when order is placed


## complete
- [x] Create Thread and Message models in core/chat module
- [x] Create ThreadRepository and MessageRepository with CRUD operations
- [x] Create ThreadService and MessageService with business logic
- [x] Integrate auto-thread creation in orders service when order is created
- [x] Create SSE hub for admin and user event streaming
- [x] Implement Admin SSE endpoint (GET /admin/sse)
- [x] Implement User SSE endpoint (GET /users/sse/notification/:user_id)
- [x] Create ChatController with thread and message endpoints
- [x] Add file upload support for messages (≤5MB)
- [x] Integrate SSE event emissions on message creation and thread closure
- [x] Add thread closure endpoint (admin only)
- [x] Integrate chat routes in main.go
- [x] Create constants for order status codes, event names, and plugin targets in common/constants
- [x] Replace all direct string uses with constants throughout the codebase for order statuses, events, and plugin targets
- [x] users can view there orders based on jwt, extract user id from jwt and send there own order data in a paginated way
- [x] users can create order, view there order, view order history this will be for there own order data from jwt. need these endpoints
- [x] admin can view any order, update to any status, view all the order items.
- [x] create a backend resource named orders that deals with order
- [x] how so ever the cart is implemented in the frontend, do the same for backend, send just ids and quantity and other details and shipping details of users, redundant data is okay, but it has to be like this
- [x] calculate the price, take the price from frontend as well, at the very end tally the price calculated from backend is accruate with frontend, just do a log while creating the order, http-incercepted so that admin knows, some one is trying to do something.
- [x] create event driven orders table, so that there are n steps of orders, in future there will be more, so make sure its dynamic, for now the states are (ORDER PLACED (pending, canceled, rejected, rejected by user), SELLER DISPATCH (seller notified, seller processing, seller waiting for dispatch, seller dispatched), shipping agent(agent picked from seller, agent transporting, agent out for delivery, order delivered), users (user cancelled on arrival, user cancled the order, user returned), payment dispute(user returning the order, users returned order recieved, users refund initiated, users refund failed, users refund processed))
- [x] create multiple modules for this, order is separate, order status are separately managed, use solid principals and good coding techniques
- [x] follow cartSlice.ts to see how it looks in cart, same way the order will be saved, dont use references for order, store the actual data in json, because order is atomic once done it wont go. product ids can be reference, but also keep a copy of the json data for persistance.
- [x] similar to the backend do the admin panel, for orders, show orders tables, recent orders first and recent order status updates. if a order status updates, also update the order feild, that is order_current_status: <refer to the recent status>
- [x] keep filters, paginate it
- [x] when clicked on order, take to particular order status page, show all details, from status changes event, order create to order delivered.
- [x] create a form to manually update the status of the order, to update the status, (orderid, new_status, reason) admin endpoint only admin can do this.
- [x] i want a users reset password section thats works manually. users will mail from there official mail to admin, that they want password reset, so from admin panel, there will be a section, where admin will generate a token with frontend link, that will look like <currentdomaim>/forgetpassword?token=<oldpasswordhash>, so users can click this link and go to a page a new page, that will hit a route /api/reset-password with data { token: "", newpassword: "" }, verify that this is done properly. for both api end, admin panel section and frontend page



## high priority tasks
- [x] @checkout.tsx make sure the order is placed, this is just for frontend, then touch the admin panel
- [x] use slices for state management, so that backend is unified. put proper loaders both for frontend and admin panel.
 - [x] for users only users can cancel the order, and if delivered, within 2 days they can ask for refund, add this logic.


