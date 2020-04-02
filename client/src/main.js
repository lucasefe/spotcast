import Vue from 'vue'
import App from './App.vue'
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import VueSocketIO from "vue-socket.io";
import vuetify from './plugins/vuetify';

Vue.use(Vuetify);
Vue.use(
  new VueSocketIO({
    debug: true,
    connection: "http://localhost:3000"
  })
);

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
