import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from "vue-socket.io";
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Buefy)
Vue.use(new VueSocketIO({ debug: true, connection: "/" }));

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount('#app')
