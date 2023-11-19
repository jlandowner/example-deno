DENO_KV_ACCESS_TOKEN ?= "insecure-accesss-token"

.PHONY: docker-kv
docker-kv:
	docker run -it --rm --name denokv --init -p 4512:4512 -v ${PWD}/data:/data \
		ghcr.io/denoland/denokv \
			--sqlite-path /data/denokv.sqlite serve \
			--access-token $(DENO_KV_ACCESS_TOKEN)

.PHONY: run
run:
	DENO_KV_ACCESS_TOKEN=$(DENO_KV_ACCESS_TOKEN) deno run --unstable -A main.ts
