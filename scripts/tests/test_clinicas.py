import copy
import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('catalog', Path(__file__).resolve().parents[1] / 'build-clinicas.py')
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)

class PublishingGate(unittest.TestCase):
    def setUp(self):
        self.item = dict(id='test', status='published', name='Instituição de teste', city='São Paulo', state='SP', description='Somente fixture de teste', specialties=['Saúde mental'], care_types=[], insurance=[], phone='', website='', image='', image_alt='', cnes='', verification_url='https://example.org/fonte', reviewed_at='2026-01-01')
    def test_drafts_never_reach_public_catalog(self):
        self.assertEqual(catalog.export_catalog({'hospitals':[{'id':'draft', 'status':'draft', 'internal':'private'}]}), {'hospitals':[]})
    def test_internal_fields_are_not_exported(self):
        self.item['internal'] = 'private'
        self.assertNotIn('internal', catalog.export_catalog({'hospitals':[self.item]})['hospitals'][0])
    def test_unreviewed_and_unsafe_links_cannot_publish(self):
        for field, value in [('reviewed_at',''), ('website','javascript:alert(1)'), ('image','https://example.org/image'), ('state','XX'), ('verification_url',''), ('reviewed_at','2999-01-01')]:
            with self.subTest(field=field, value=value):
                item=copy.deepcopy(self.item); item[field]=value
                with self.assertRaises(ValueError): catalog.export_catalog({'hospitals':[item]})
    def test_duplicate_ids_fail(self):
        with self.assertRaises(ValueError): catalog.export_catalog({'hospitals':[self.item, self.item]})
