<script setup lang="ts">
const routes = useRouter().getRoutes()

useTestResult(
  routes.map(({ components, ...rest }) => rest),
)
</script>
