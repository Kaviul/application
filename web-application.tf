provider "kubernetes" {
  config_path    = "~/.kube/config"

}


resource "kubernetes_namespace" "kav-web-app" {
  metadata {
    name = "kav-web-app"
  }
}

resource "kubernetes_deployment" "kav-web-app-deply" {
  metadata {
    name      = "kav-web-app-deply"
    namespace = kubernetes_namespace.kav-web-app.metadata.0.name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "kav-web-app"
      }
    }
    template {
      metadata {
        labels = {
          app = "kav-web-app"
        }
      }
      spec {
        container {
          image = "kaviuln/web-app-image"
          name  = "kav-web-app-container"
          port {
            container_port = 8080
          }
          

      }
    }
  }
}
}

resource "kubernetes_service" "kav-web-app" {
  metadata {
    name      = "kav-web-app"
    namespace = kubernetes_namespace.kav-web-app.metadata.0.name
  }
  spec {
    selector = {
      app = kubernetes_deployment.kav-web-app-deply.spec.0.template.0.metadata.0.labels.app
    }
    type = "LoadBalancer"
    port {
      port        = 80
      target_port = 8080
    }
  }
}

