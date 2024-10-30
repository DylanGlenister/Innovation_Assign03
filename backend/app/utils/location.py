'''All locations available to the prediction model.'''

from enum import Enum

class Location(str, Enum):
	'''Enum class containing all locations available to the prediction model.'''
	Albury = 'Albury'
	BadgerysCreek = 'BadgerysCreek'
	Cobar = 'Cobar'
	CoffsHarbour = 'CoffsHarbour'
	Moree = 'Moree'
	Newcastle = 'Newcastle'
	NorahHead = 'NorahHead'
	NorfolkIsland = 'NorfolkIsland'
	Penrith = 'Penrith'
	Richmond = 'Richmond'
	Sydney = 'Sydney'
	SydneyAirport = 'SydneyAirport'
	WaggaWagga = 'WaggaWagga'
	Williamtown = 'Williamtown'
	Wollongong = 'Wollongong'
	Canberra = 'Canberra'
	Tuggeranong = 'Tuggeranong'
	MountGinini = 'MountGinini'
	Ballarat = 'Ballarat'
	Bendigo = 'Bendigo'
	Sale = 'Sale'
	MelbourneAirport = 'MelbourneAirport'
	Melbourne = 'Melbourne'
	Mildura = 'Mildura'
	Nhil = 'Nhil'
	Portland = 'Portland'
	Watsonia = 'Watsonia'
	Dartmoor = 'Dartmoor'
	Brisbane = 'Brisbane'
	Cairns = 'Cairns'
	GoldCoast = 'GoldCoast'
	Townsville = 'Townsville'
	Adelaide = 'Adelaide'
	MountGambier = 'MountGambier'
	Nuriootpa = 'Nuriootpa'
	Woomera = 'Woomera'
	Albany = 'Albany'
	Witchcliffe = 'Witchcliffe'
	PearceRAAF = 'PearceRAAF'
	PerthAirport = 'PerthAirport'
	Perth = 'Perth'
	SalmonGums = 'SalmonGums'
	Walpole = 'Walpole'
	Hobart = 'Hobart'
	Launceston = 'Launceston'
	AliceSprings = 'AliceSprings'
	Darwin = 'Darwin'
	Katherine = 'Katherine'
	Uluru = 'Uluru'

	@staticmethod
	def switch_loc(_loc: str):
		match _loc:
			case 'Albury':
				return 0
			case 'BadgerysCreek':
				return 1
			case 'Cobar':
				return 2
			case 'CoffsHarbour':
				return 3
			case 'Moree':
				return 4
			case 'Newcastle':
				return 5
			case 'NorahHead':
				return 6
			case 'NorfolkIsland':
				return 7
			case 'Penrith':
				return 8
			case 'Richmond':
				return 9
			case 'Sydney':
				return 10
			case 'SydneyAirport':
				return 11
			case 'WaggaWagga':
				return 12
			case 'Williamtown':
				return 13
			case 'Wollongong':
				return 14
			case 'Canberra':
				return 15
			case 'Tuggeranong':
				return 16
			case 'MountGinini':
				return 17
			case 'Ballarat':
				return 18
			case 'Bendigo':
				return 19
			case 'Sale':
				return 20
			case 'MelbourneAirport':
				return 21
			case 'Melbourne':
				return 22
			case 'Mildura':
				return 23
			case 'Nhil':
				return 24
			case 'Portland':
				return 25
			case 'Watsonia':
				return 26
			case 'Dartmoor':
				return 27
			case 'Brisbane':
				return 28
			case 'Cairns':
				return 29
			case 'GoldCoast':
				return 30
			case 'Townsville':
				return 31
			case 'Adelaide':
				return 32
			case 'MountGambier':
				return 33
			case 'Nuriootpa':
				return 34
			case 'Woomera':
				return 35
			case 'Albany':
				return 36
			case 'Witchcliffe':
				return 37
			case 'PearceRAAF':
				return 38
			case 'PerthAirport':
				return 39
			case 'Perth':
				return 40
			case 'SalmonGums':
				return 41
			case 'Walpole':
				return 42
			case 'Hobart':
				return 43
			case 'Launceston':
				return 44
			case 'AliceSprings':
				return 45
			case 'Darwin':
				return 46
			case 'Katherine':
				return 47
			case 'Uluru':
				return 48
			case _:
				return -1

	@staticmethod
	def switch_id(_id: int):
		match _id:
			case 0:
				return 'Albury'
			case 1:
				return 'BadgerysCreek'
			case 2:
				return 'Cobar'
			case 3:
				return 'CoffsHarbour'
			case 4:
				return 'Moree'
			case 5:
				return 'Newcastle'
			case 6:
				return 'NorahHead'
			case 7:
				return 'NorfolkIsland'
			case 8:
				return 'Penrith'
			case 9:
				return 'Richmond'
			case 10:
				return 'Sydney'
			case 11:
				return 'SydneyAirport'
			case 12:
				return 'WaggaWagga'
			case 13:
				return 'Williamtown'
			case 14:
				return 'Wollongong'
			case 15:
				return 'Canberra'
			case 16:
				return 'Tuggeranong'
			case 17:
				return 'MountGinini'
			case 18:
				return 'Ballarat'
			case 19:
				return 'Bendigo'
			case 20:
				return 'Sale'
			case 21:
				return 'MelbourneAirport'
			case 22:
				return 'Melbourne'
			case 23:
				return 'Mildura'
			case 24:
				return 'Nhil'
			case 25:
				return 'Portland'
			case 26:
				return 'Watsonia'
			case 27:
				return 'Dartmoor'
			case 28:
				return 'Brisbane'
			case 29:
				return 'Cairns'
			case 30:
				return 'GoldCoast'
			case 31:
				return 'Townsville'
			case 32:
				return 'Adelaide'
			case 33:
				return 'MountGambier'
			case 34:
				return 'Nuriootpa'
			case 35:
				return 'Woomera'
			case 36:
				return 'Albany'
			case 37:
				return 'Witchcliffe'
			case 38:
				return 'PearceRAAF'
			case 39:
				return 'PerthAirport'
			case 40:
				return 'Perth'
			case 41:
				return 'SalmonGums'
			case 42:
				return 'Walpole'
			case 43:
				return 'Hobart'
			case 44:
				return 'Launceston'
			case 45:
				return 'AliceSprings'
			case 46:
				return 'Darwin'
			case 47:
				return 'Katherine'
			case 48:
				return 'Uluru'
			case _:
				return None
