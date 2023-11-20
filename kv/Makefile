DENO_KV_ACCESS_TOKEN ?= "insecure-accesss-token"

.PHONY: docker-kv
docker-kv:
	docker run -it --rm --name denokv --init -p 4512:4512 -v ${PWD}/data:/data \
		ghcr.io/denoland/denokv \
			--sqlite-path /data/denokv.sqlite serve \
			--access-token $(DENO_KV_ACCESS_TOKEN)

.PHONY: run-example
run-example:
	DENO_KV_ACCESS_TOKEN=$(DENO_KV_ACCESS_TOKEN) deno run --unstable -A example.ts

.PHONY: run-api
run-api:
	DENO_KV_ACCESS_TOKEN=$(DENO_KV_ACCESS_TOKEN) DENO_KV_URL="http://0.0.0.0:4512" deno run --unstable -A api.ts
