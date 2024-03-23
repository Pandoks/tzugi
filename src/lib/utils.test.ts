import { describe, expect, test } from 'vitest';
import { paginationTextGenerator } from './utils';

describe('Pagination text generation', () => {
	test('Less than pagination navigation length (7)', () => {
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 1 })).toStrictEqual(['current']);
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 2 })).toStrictEqual(['current', '2']);
		expect(paginationTextGenerator({ pageIndex: 1, pageCount: 2 })).toStrictEqual(['1', 'current']);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 6 })).toStrictEqual([
			'1',
			'2',
			'3',
			'4',
			'current',
			'6'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 7 })).toStrictEqual([
			'1',
			'2',
			'3',
			'4',
			'current',
			'6',
			'7'
		]);
	});

	test('Pagination of size 8', () => {
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 8 })).toStrictEqual([
			'current',
			'2',
			'3',
			'4',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 2, pageCount: 8 })).toStrictEqual([
			'1',
			'2',
			'current',
			'4',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 3, pageCount: 8 })).toStrictEqual([
			'1',
			'2',
			'3',
			'current',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'current',
			'6',
			'7',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 5, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'5',
			'current',
			'7',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 7, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'5',
			'6',
			'7',
			'current'
		]);
	});

	test('Pagination of size 20', () => {
		console.log(paginationTextGenerator({ pageIndex: 0, pageCount: 20 }));
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 20 })).toStrictEqual([
			'current',
			'2',
			'3',
			'4',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 2, pageCount: 20 })).toStrictEqual([
			'1',
			'2',
			'current',
			'4',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 3, pageCount: 20 })).toStrictEqual([
			'1',
			'2',
			'3',
			'current',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'4',
			'current',
			'6',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 9, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'9',
			'current',
			'11',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 15, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'15',
			'current',
			'17',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 16, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'current',
			'18',
			'19',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 17, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'17',
			'current',
			'19',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 19, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'17',
			'18',
			'19',
			'current'
		]);
	});
});
