import assert from "node:assert/strict";
import { test } from "node:test";
import { annualProgrammeName } from "./annual-programme-name";

test("explicit source levels have one short/full naming policy", () => {
  for(const title of ["BrainMaster (ШМИ1) Группа 3 (платно)","ШМИ-1", "Школа Молодого IT-Инженера(1 год обучения)(3 группа)"]) {
    assert.deepEqual(annualProgrammeName(title),{short:"ШМИ · 1-й год",full:"Школа Молодого IT-Инженера · 1-й год",studyYear:1});
  }
  for(const title of ["ШМИ2", "1517 (2-ой год обучения) (2 группа)"]) assert.equal(annualProgrammeName(title).studyYear,2);
});
test("school, grade, group and academic-year digits are never inferred as study year", () => {
  for(const title of ['1383. "Школа молодого ИТ-инженера" (2026-2027 уч.год)',"Школа Молодого IT-Инженера 1-2 (1-6 классы)","Школа Молодого IT-Инженера 3 (1-6 классы)","Школа молодого IT инженера 1-М","ШМИ Группа 1"]) {
    assert.equal(annualProgrammeName(title).studyYear,null);
    assert.equal(annualProgrammeName(title).short,"ШМИ");
  }
});
test("2044 grade bands and robotics remain useful, without administrative noise", () => {
  const name=annualProgrammeName("Школа Молодого IT-Инженера BrainMaster 1-4 класс-8. Робототехника.");
  assert.equal(name.short,"ШМИ · робототехника · 1–4 классы");
  assert.equal(name.studyYear,null);
});
