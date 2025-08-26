build:
	npm run build
	docker build -t rodrigobrito/facemetrics .
	docker push rodrigobrito/facemetrics
	kubectl rollout restart deployment fono