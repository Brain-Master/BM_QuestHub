import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('year_import', Path(__file__).with_name('import-year-schedule.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture():
    shared = dict(listing_id='123', school='Тестовая школа', address='Тестовый адрес',
                  course_title='Школа Молодого IT-Инженера', direct_card_id='456',
                  direct_url='https://www.mos.ru/pgu2/activity/card/456',
                  search_url='https://www.mos.ru/pgu2/activity/groups?keyword=123')
    group = dict(shared, group_code='К1-26', status='Идет прием', course_start='2026-09-01', course_end='2027-05-31',
                 total_seats='12', free_seats='2', occupied_seats='10', age_min='6', age_max='13',
                 teacher_preferred='Тестовый педагог', teacher_basis='Карточка', lesson_price_rub='1000',
                 course_price_rub='35000', contact_phone='DO NOT PUBLISH', registry_field='DO NOT PUBLISH')
    slot = dict(shared, group_code='К1-26', course_start='2026-09-01', course_end='2027-05-31',
                weekday='Вторник', start_time='16:40', end_time='17:25')
    return {'cards': [shared], 'groups': [group], 'locations': [dict(location_id='LOC-1',school=shared['school'],address=shared['address'],metro='')], 'schedule':[slot]}


class ImportTests(unittest.TestCase):
    def setUp(self): self.data = fixture()
    def run_projection(self): return module.project(self.data, 'a' * 64)
    def test_project_whitelists_public_fields(self):
        result = self.run_projection()['groups'][0]
        self.assertNotIn('contact_phone', result)
        self.assertNotIn('registry_field', result)
        self.assertEqual(result['link'], 'https://www.mos.ru/pgu2/activity/card/456')
        self.assertEqual(result['listingId'], '123')
    def test_two_weekly_slots_not_two_groups(self):
        self.data['schedule'].append(dict(self.data['schedule'][0],weekday='Четверг'))
        self.assertEqual(len(self.run_projection()['groups']),1)
        self.assertEqual(len(self.run_projection()['groups'][0]['slots']),2)
    def test_duplicate_group_rejected(self):
        self.data['groups'].append(copy.deepcopy(self.data['groups'][0]))
        with self.assertRaisesRegex(ValueError,'Duplicate'): self.run_projection()
    def test_duplicate_slot_rejected(self):
        self.data['schedule'].append(copy.deepcopy(self.data['schedule'][0]))
        with self.assertRaisesRegex(ValueError,'Duplicate'): self.run_projection()
    def test_orphan_schedule_rejected(self):
        self.data['schedule'][0]['group_code']='unknown'
        with self.assertRaisesRegex(ValueError,'Orphan'): self.run_projection()
    def test_address_join_exact(self):
        self.data['groups'][0]['address']='Другой корпус'
        self.data['schedule'][0]['address']='Другой корпус'
        with self.assertRaisesRegex(ValueError,'Unknown exact'): self.run_projection()
    def test_unknown_price_stays_unknown(self):
        self.data['groups'][0]['lesson_price_rub']=''
        self.assertIsNone(self.run_projection()['groups'][0]['lessonPrice'])
    def test_negative_price_rejected(self):
        self.data['groups'][0]['lesson_price_rub']='-1'
        with self.assertRaises(ValueError): self.run_projection()
    def test_bad_seat_arithmetic_rejected(self):
        self.data['groups'][0]['free_seats']='13'
        with self.assertRaisesRegex(ValueError,'seat'): self.run_projection()
    def test_invalid_calendar_date_rejected(self):
        for name in ['groups','schedule']: self.data[name][0]['course_start']='2026-02-30'
        with self.assertRaises(ValueError): self.run_projection()
    def test_missing_slot_rejected(self):
        self.data['schedule']=[]
        with self.assertRaisesRegex(ValueError,'Missing weekly'): self.run_projection()
    def test_unknown_status_rejected(self):
        self.data['groups'][0]['status']='Maybe'
        with self.assertRaisesRegex(ValueError,'Unknown reception'): self.run_projection()
    def test_link_host_rejected(self):
        for name in ['groups','cards']: self.data[name][0]['direct_url']='https://evil.example/card/456'
        with self.assertRaisesRegex(ValueError,'Unsafe'): self.run_projection()
    def test_search_fallback_does_not_invent_card_id(self):
        for name in ['groups','cards']:
            self.data[name][0]['direct_url']=''
            self.data[name][0]['direct_card_id']=''
        group=self.run_projection()['groups'][0]
        self.assertEqual(group['linkKind'],'search')
        self.assertEqual(group['link'],'https://www.mos.ru/pgu2/activity/groups?keyword=123')
    def test_inferred_capacity_and_registry_teacher_hidden(self):
        self.data['groups'][0]['group_code']='listing:123'
        self.data['schedule'][0]['group_code']='listing:123'
        group=self.run_projection()['groups'][0]
        self.assertIsNone(group['totalSeats'])
        self.assertIsNone(group['freeSeats'])
        self.assertIsNone(group['teacher'])
        self.assertIsNone(group['groupCode'])
    def test_non_shmi_not_silently_mapped(self):
        for name in ['groups','cards']: self.data[name][0]['course_title']='Инженерная Академия'
        with self.assertRaisesRegex(ValueError,'Unmapped'): self.run_projection()


if __name__ == '__main__': unittest.main()
