export type StarShape = 'dot' | 'four' | 'six' | 'orb';
export type MemoryStarData = { id: number; name: string; date: string; x: number; y: number; size: number; shape: StarShape; tone: 'cream' | 'peach' | 'rose'; favorite?: boolean; depth?: number; photoCount?: number; created?: boolean };
export const memoryStars: MemoryStarData[] = [
  { id: 1, name: '처음 집에 온 날', date: '2012. 04. 18', x: 48, y: 31, size: 11, shape: 'four', tone: 'cream', favorite: true },
  { id: 2, name: '창가의 오후', date: '2012. 08. 02', x: 40, y: 41, size: 7, shape: 'dot', tone: 'cream' },
  { id: 3, name: '노란 담요', date: '2013. 01. 17', x: 58, y: 38, size: 9, shape: 'six', tone: 'peach' },
  { id: 4, name: '가만히 바라보던 밤', date: '2013. 06. 12', x: 64, y: 47, size: 8, shape: 'dot', tone: 'cream' },
  { id: 5, name: '따뜻한 낮잠', date: '2014. 02. 09', x: 32, y: 49, size: 12, shape: 'orb', tone: 'peach' },
  { id: 6, name: '함께 맞은 비', date: '2014. 07. 23', x: 53, y: 49, size: 6, shape: 'dot', tone: 'cream' },
  { id: 7, name: '첫 번째 겨울', date: '2014. 12. 03', x: 69, y: 36, size: 7, shape: 'four', tone: 'cream' },
  { id: 8, name: '느린 아침', date: '2015. 05. 28', x: 37, y: 29, size: 6, shape: 'dot', tone: 'cream' },
  { id: 9, name: '복숭아빛 저녁', date: '2015. 09. 14', x: 72, y: 55, size: 11, shape: 'orb', tone: 'rose' },
  { id: 10, name: '내 옆의 온기', date: '2016. 03. 21', x: 45, y: 52, size: 8, shape: 'six', tone: 'peach' },
  { id: 11, name: '작은 발자국', date: '2016. 11. 07', x: 60, y: 58, size: 6, shape: 'dot', tone: 'cream' },
  { id: 12, name: '긴 낮잠', date: '2017. 04. 30', x: 27, y: 39, size: 7, shape: 'four', tone: 'peach' },
  { id: 13, name: '우리의 봄', date: '2017. 08. 19', x: 76, y: 42, size: 6, shape: 'dot', tone: 'cream' },
  { id: 14, name: '조용한 인사', date: '2018. 02. 11', x: 56, y: 27, size: 7, shape: 'dot', tone: 'cream' },
  { id: 15, name: '곁을 내어준 날', date: '2018. 10. 25', x: 34, y: 59, size: 8, shape: 'six', tone: 'cream' },
  { id: 16, name: '햇살 한 조각', date: '2019. 03. 16', x: 67, y: 27, size: 6, shape: 'four', tone: 'cream' },
  { id: 17, name: '마지막 여름', date: '2019. 07. 29', x: 79, y: 62, size: 7, shape: 'dot', tone: 'peach' },
  { id: 18, name: '별이 된 오후', date: '2020. 01. 08', x: 43, y: 63, size: 6, shape: 'dot', tone: 'cream' },
  { id: 19, name: '잊지 않을 온기', date: '2020. 06. 03', x: 22, y: 54, size: 9, shape: 'orb', tone: 'peach' },
  { id: 20, name: '언제나 여기', date: '2020. 09. 27', x: 63, y: 67, size: 7, shape: 'four', tone: 'cream', favorite: true },
];
export const constellationPairs = [[1,2],[1,3],[2,5],[3,4],[3,6],[4,7],[5,10],[6,11],[7,13],[10,15],[11,20]];
export const mobileStarPositions: Record<number, [number, number]> = {
  1:[47,29],2:[25,38],3:[66,37],4:[79,46],5:[17,51],6:[48,47],7:[84,31],8:[27,25],9:[83,57],10:[33,55],
  11:[63,56],12:[12,34],13:[91,40],14:[57,23],15:[18,62],16:[75,24],17:[92,65],18:[39,66],19:[8,57],20:[69,67],
};
export const starDepths: Record<number, 'far' | 'mid' | 'near'> = {
  1:'near',2:'mid',3:'near',4:'mid',5:'near',6:'far',7:'mid',8:'far',9:'near',10:'mid',
  11:'far',12:'mid',13:'far',14:'mid',15:'near',16:'far',17:'mid',18:'far',19:'near',20:'mid',
};
