import 'buefy/dist/buefy.css'
import App from './App.vue'
import Home from './pages/Home.vue'
import NotFoundPage from './pages/NotFound.vue'
import Buefy from 'buefy'
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueSocketIO from "vue-socket.io";

Vue.use(Buefy)
Vue.use(VueRouter)
Vue.use(new VueSocketIO({ debug: true, connection: "/" }));

Vue.config.productionTip = false;

const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/:room',
    component: Home
  },
  {
    path: '/notFound',
    alias: '*',
    component: NotFoundPage
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
