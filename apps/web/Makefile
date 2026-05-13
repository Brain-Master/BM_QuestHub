# Единый источник правды — корневой Makefile в BM_QuestHub/Makefile.
# Цели здесь только пробрасываются туда (`make -C`).

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)

.PHONY: default

default:
	@$(MAKE) -C "$(ROOT)" run

%:
	@$(MAKE) -C "$(ROOT)" $@
