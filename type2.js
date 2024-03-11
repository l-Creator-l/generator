export default function type2(json, yMirror, returnData, additionalData) {

	const wallsJSON = json.layers['layer-1'].lines;
	const featuresJSON = json.layers['layer-1'].vertices;
	const holesJSON = json.layers['layer-1'].holes;

	function getDoorwayProps(id, inner) {
		let width, height;
		if (inner) {
			width = typeof holesJSON[id].properties.width === 'number' ? holesJSON[id].properties.width / 10 : holesJSON[id].properties.width.length;
			height = typeof holesJSON[id].properties.height === 'number' ? holesJSON[id].properties.height / 10 : holesJSON[id].properties.height.length;
		}
		else {
			width = typeof holesJSON[id].properties.width === 'number' ? holesJSON[id].properties.width : holesJSON[id].properties.width.length;
			height = typeof holesJSON[id].properties.height === 'number' ? holesJSON[id].properties.height : holesJSON[id].properties.height.length;
		}
		return { width: Math.round(width), height: height > walls.height ? walls.height : height };
	}

	function getOffsetRelative(offset) {

		const rest = Math.round(offset % 30);
		
		if (offset % 10 === 0) return offset;
		else if (rest <= 15) return offset - (offset % 30);
		else if (rest > 15) return offset - (offset % 30) + 30;
		
	}

	function getOffsetAbsolute(offset) {

		const rest = Math.round(offset % 30);
		
		if (offset % 10 === 0) return 100 + offset + walls.thickness;
		else if (rest <= 15) return 100 + offset - (offset % 30) + walls.thickness;
		else if (rest > 15) return 100 + offset - (offset % 30) + 30 + walls.thickness;
		
	}

	function configurer(thisWall) {

		const wall = thisWall.length - walls.thickness * 2;
		const holes = [];
		let panels = [];

		function getPanels(totalLength) {

			const array = [];
			let sum = 0;

			while (sum < totalLength) {
				if (totalLength - sum >= 120) {
					array.push(120);
					sum += 120;
				}
				else if (totalLength - sum >= 90) {
					array.push(90);
					sum += 90;
				}
				else if (totalLength - sum >= 60) {
					array.push(60);
					sum += 60;
				}
				else if (totalLength - sum >= 30) {
					array.push(30);
					sum += 30;
				}
				else if (totalLength - sum < 30) {
					array.push(totalLength - sum);
					sum += totalLength - sum;
				}
			}

			return array;

		}

		function rebuildInnerPanels(thisPosition, nextPosition, thisType, nextType, thisDirection, nextDirection, thisHoleNumber) {

			const oldArray = panels.slice(thisPosition + 1, nextPosition);
			let newArray = [];
			let totalLength = oldArray.reduce((sum, current) => sum += current);

			if (
				(thisType === 'containerdoor' && nextType === 'containerdoor')
				||
				(thisType === 'slidingdoor' && nextType === 'containerdoor')
			) {
				if (oldArray[oldArray.length - 1] >= 30) return;
				if (oldArray.length > 2) {
					[oldArray[oldArray.length - 2], oldArray[oldArray.length - 1]] = [oldArray[oldArray.length - 1], oldArray[oldArray.length - 2]];
					panels.splice(thisPosition + 1, oldArray.length, ...oldArray);
				}
				else if (oldArray.length <= 2) {
					newArray = getPanels(totalLength - 30);
					newArray.push(30);
					panels.splice(thisPosition + 1, oldArray.length, ...newArray);
				}
			}
			else if (
				(thisType === 'slidingdoor' && nextType === 'slidingdoor') 
				||
				(thisType === 'containerdoor' && nextType === 'slidingdoor')
				||
				(thisType !== 'slidingdoor' && thisType !== 'containerdoor' && nextType === 'slidingdoor')
			) {
				if (
					(nextDirection === 'left' && (thisWall.label === 'top' || thisWall.label === 'right' || thisWall.label === 'inner-horizontal' || thisWall.label === 'inner-vertical'))
					||
					(nextDirection === 'right' && (thisWall.label === 'bottom' || thisWall.label === 'left'))
					||
					(nextDirection === 'any')
				) {
					if (oldArray[oldArray.length - 1] >= 90) return;
					newArray = getPanels(totalLength - 90);
					newArray.push(90);
					panels.splice(thisPosition + 1, oldArray.length, ...newArray);
				}
				else if (nextDirection === 'left' || nextDirection === 'right') {
					if (oldArray[oldArray.length - 1] >= 30) return;
					newArray = getPanels(totalLength - 30);
					newArray.push(30);
					panels.splice(thisPosition + 1, oldArray.length, ...newArray);
				}
			}
			else if (thisType !== 'slidingdoor' && thisType !== 'containerdoor' && nextType === 'containerdoor') {
				if (oldArray[oldArray.length - 1] >= 30) return;
				[oldArray[oldArray.length - 2], oldArray[oldArray.length - 1]] = [oldArray[oldArray.length - 1], oldArray[oldArray.length - 2]];
				panels.splice(thisPosition + 1, oldArray.length, ...oldArray);
			}

			const difference = newArray.length - oldArray.length;

			for (let i = thisHoleNumber; i < holes.length; i++) {
				holes[i].holePosition += difference;
			}

		}

		thisWall.holes.forEach(id => {
			for (let key in holesJSON) {

				const [type, holeId] = [holesJSON[key].type, key];
				const offset = 'offsetA' in holesJSON[key].misc ? getOffsetRelative(holesJSON[key].misc.offsetA) : getOffsetRelative(holesJSON[key].misc.offsetB);
				let direction = 'any';

				if (holeId !== id) continue;
				if (holesJSON[key].properties.dver_block) direction = /^Левая/i.test(holesJSON[key].properties.dver_block) ? 'left' : 'right';
				holes.push({
					type,
					id,
					offset,
					length: type === 'doorway' ? getDoorwayProps(key, thisWall.label.startsWith('inner')).width : 120,
					direction
				});

			}
		});

		if (holes.length === 1) {

			let holePosition;
			const reverse = (holes[0].offset + holes[0].length / 2 > wall / 2) ? true : false;

			switch (reverse) {
				case false:
					panels = panels.concat(getPanels(holes[0].offset));
					panels.push(holes[0].length);
					holePosition = panels.length - 1;
					const restLength1 = wall - panels.reduce((sum, current) => sum += current);
					panels = panels.concat(getPanels(restLength1));
				break;
				case true:
					panels = getPanels(holes[0].offset).reverse();
					panels.push(holes[0].length);
					holePosition = panels.length - 1;
					const restLength2 = wall - panels.reduce((sum, current) => sum += current);
					panels = panels.concat(getPanels(restLength2).reverse());
				break;
			}

			switch (holes[0].type) {
				case 'containerdoor':
					if (panels[holePosition + 1] < 30 && panels[holePosition + 2] >= 30) {
						[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
					}
					if (panels[holePosition - 1] < 30 && panels[holePosition - 2] >= 30) {
						[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
					}
				break;
				case 'slidingdoor':
					if (
						(holes[0].direction === 'left' && (thisWall.label === 'top' || thisWall.label === 'right' || thisWall.label === 'inner-horizontal' || thisWall.label === 'inner-vertical'))
						||
						(holes[0].direction === 'right' && (thisWall.label === 'bottom' || thisWall.label === 'left'))
						||
						(holes[0].direction === 'any')
					) {

						if (panels[holePosition - 1] < 90 && panels[holePosition - 2] >= 90) {
							[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
						}
						else if (panels[holePosition - 1] < 30 && panels[holePosition - 2] < 90 && panels[holePosition - 3] > 90) {
							const targetPanel = panels[holePosition - 3];
							const part = 90 - panels[holePosition - 2];
							panels.splice(holePosition - 3, 3, targetPanel - part, panels[holePosition - 1], 90);
						}
						
						if (panels[holePosition + 1] < 30 && panels[holePosition + 2] >= 30) {
							[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
						}

					}
					else if (holes[0].direction === 'left' || holes[0].direction === 'right') {

						if (panels[holePosition + 1] < 90 && panels[holePosition + 2] >= 90) {
							[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
						}
						else if (panels[holePosition + 1] < 30 && panels[holePosition + 2] < 90 && panels[holePosition + 3] > 90) {
							const targetPanel = panels[holePosition + 3];
							const part = 90 - panels[holePosition + 2];
							panels.splice(holePosition + 1, 3, 90, panels[holePosition + 1], targetPanel - part);
						}

						if (panels[holePosition - 1] < 30 && panels[holePosition - 2] >= 30) {
							[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
						}
						
					}
				break;
			}

		}

		else {

			holes.sort((a, b) => a.offset - b.offset);

			holes.forEach((hole, i) => {

				if (i === 0) {
					panels = panels.concat(getPanels(hole.offset));
					panels.push(hole.length);
					hole.holePosition = panels.length - 1;
				}
				else if (i < holes.length - 1) {
					panels = panels.concat(getPanels(hole.offset - holes[i - 1].offset - holes[i - 1].length));
					panels.push(hole.length);
					hole.holePosition = panels.length - 1;
				}
				else if (i === holes.length - 1) {
					panels = panels.concat(getPanels(hole.offset - holes[i - 1].offset - holes[i - 1].length));
					panels.push(hole.length);
					hole.holePosition = panels.length - 1;
					const restLength = wall - panels.reduce((sum, current) => sum += current);
					panels = panels.concat(getPanels(restLength));
				}

			});

			for (const [i, hole] of holes.entries()) {

				const holePosition = hole.holePosition;
				const previousHolePosition = i > 0 ? holes[i - 1].holePosition : '';
				const nextHolePosition = (holes.length - 1 > i) ? holes[i + 1].holePosition : '';
				const nextType = nextHolePosition !== '' ?  holes[i + 1].type : '';

				switch (hole.type) {

					case 'doorway':

						if (nextType === 'containerdoor' || nextType === 'slidingdoor') {
							rebuildInnerPanels(holePosition, nextHolePosition, hole.type, nextType, hole.direction, holes[i + 1].direction, i);
						}

					break;

					case 'basedoor':

						if (nextType === 'containerdoor' || nextType === 'slidingdoor') {
							rebuildInnerPanels(holePosition, nextHolePosition, hole.type, nextType, hole.direction, holes[i + 1].direction, i);
						}

					break;

					case 'containerdoor':

						if (panels[holePosition + 1] < 30 && panels[holePosition + 2] >= 30 && nextHolePosition === '') {
							[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
						}

						if (panels[holePosition - 1] < 30 && panels[holePosition - 2] >= 30 && previousHolePosition === '') {
							[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
						}

						if (nextHolePosition !== '') {
							rebuildInnerPanels(holePosition, nextHolePosition, hole.type, nextType, hole.direction, holes[i + 1].direction, i);
						}

					break;

					case 'slidingdoor':

						if (
							(hole.direction === 'left' && (thisWall.label === 'top' || thisWall.label === 'right' || thisWall.label === 'inner-horizontal' || thisWall.label === 'inner-vertical'))
							||
							(hole.direction === 'right' && (thisWall.label === 'bottom' || thisWall.label === 'left'))
							||
							(hole.direction === 'any')
						) {
		
							if (panels[holePosition - 1] < 90 && panels[holePosition - 2] >= 90 && previousHolePosition === '') {
								[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
							}
							else if (panels[holePosition - 1] < 30 && panels[holePosition - 2] < 90 && panels[holePosition - 3] > 90 && previousHolePosition === '') {
								const targetPanel = panels[holePosition - 3];
								const part = 90 - panels[holePosition - 2];
								panels.splice(holePosition - 3, 3, targetPanel - part, panels[holePosition - 1], 90);
							}
							
							if (panels[holePosition + 1] < 30 && panels[holePosition + 2] >= 30 && nextHolePosition === '') {
								[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
							}
		
						}
						else if (hole.direction === 'left' || hole.direction === 'right') {
		
							if (panels[holePosition + 1] < 90 && panels[holePosition + 2] >= 90 && nextHolePosition === '') {
								[panels[holePosition + 2], panels[holePosition + 1]] = [panels[holePosition + 1], panels[holePosition + 2]];
							}
							else if (panels[holePosition + 1] < 30 && panels[holePosition + 2] < 90 && panels[holePosition + 3] > 90 && nextHolePosition === '') {
								const targetPanel = panels[holePosition + 3];
								const part = 90 - panels[holePosition + 2];
								panels.splice(holePosition + 1, 3, 90, panels[holePosition + 1], targetPanel - part);
							}
		
							if (panels[holePosition - 1] < 30 && panels[holePosition - 2] >= 30 && previousHolePosition === '') {
								[panels[holePosition - 2], panels[holePosition - 1]] = [panels[holePosition - 1], panels[holePosition - 2]];
							}

						}

						if (nextHolePosition !== '') {
							rebuildInnerPanels(holePosition, nextHolePosition, hole.type, nextType, hole.direction, holes[i + 1].direction, i);
						}

					break;
				}

			}

		}

		return panels;

	}

	const walls = {

		innerWalls: {
			horizontal: [],
			vertical: []
		},

		setWalls() {

			const wallsTMP = {
				horizontal: [],
				vertical: [],
				inner: {
					horizontal: [],
					vertical: []
				}
			};

			for (let key in wallsJSON) {
				if (wallsJSON[key].type === 'wall') {
					const firstVerticesId = wallsJSON[key].vertices[0];
					const secondVerticesId = wallsJSON[key].vertices[1];

					((featuresJSON[firstVerticesId].x < featuresJSON[secondVerticesId].x) || (featuresJSON[firstVerticesId].y < featuresJSON[secondVerticesId].y)) ?
						wallsJSON[key].coordinates = {
							first: [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y],
							second: [featuresJSON[secondVerticesId].x, featuresJSON[secondVerticesId].y]
						}
						:
						wallsJSON[key].coordinates = {
							first: [featuresJSON[secondVerticesId].x, featuresJSON[secondVerticesId].y],
							second: [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y]
						}

					if (!wallsJSON[key].properties.partition && featuresJSON[firstVerticesId].x === featuresJSON[secondVerticesId].x) wallsTMP.vertical.push(wallsJSON[key]);
					else if (!wallsJSON[key].properties.partition && featuresJSON[firstVerticesId].y === featuresJSON[secondVerticesId].y) wallsTMP.horizontal.push(wallsJSON[key]);
					else if (!wallsJSON[key].properties.partition && (featuresJSON[firstVerticesId].x !== featuresJSON[secondVerticesId].x) && (featuresJSON[firstVerticesId].y !== featuresJSON[secondVerticesId].y)) {
						
						const differenceX = Math.abs(featuresJSON[firstVerticesId].x - featuresJSON[secondVerticesId].x);
						const differenceY = Math.abs(featuresJSON[firstVerticesId].y - featuresJSON[secondVerticesId].y);

						if (differenceX > differenceY) featuresJSON[firstVerticesId].y = featuresJSON[secondVerticesId].y;
						else featuresJSON[firstVerticesId].x = featuresJSON[secondVerticesId].x;

						if ((featuresJSON[firstVerticesId].x < featuresJSON[secondVerticesId].x) || (featuresJSON[firstVerticesId].y < featuresJSON[secondVerticesId].y)) {
							wallsJSON[key].coordinates.first = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
							wallsJSON[key].coordinates.second = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
						}
						else {
							wallsJSON[key].coordinates.first = [featuresJSON[secondVerticesId].x, featuresJSON[secondVerticesId].y];
							wallsJSON[key].coordinates.second = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
						}

						if (featuresJSON[firstVerticesId].x === featuresJSON[secondVerticesId].x) wallsTMP.vertical.push(wallsJSON[key]);
						else if (featuresJSON[firstVerticesId].y === featuresJSON[secondVerticesId].y) wallsTMP.horizontal.push(wallsJSON[key]);

					}
					else if (wallsJSON[key].properties.partition && featuresJSON[firstVerticesId].x === featuresJSON[secondVerticesId].x) wallsTMP.inner.vertical.push(wallsJSON[key]);
					else if (wallsJSON[key].properties.partition && featuresJSON[firstVerticesId].y === featuresJSON[secondVerticesId].y) wallsTMP.inner.horizontal.push(wallsJSON[key]);
					else if (wallsJSON[key].properties.partition && (featuresJSON[firstVerticesId].x !== featuresJSON[secondVerticesId].x) && (featuresJSON[firstVerticesId].y !== featuresJSON[secondVerticesId].y)) {

						const differenceX = Math.abs(featuresJSON[firstVerticesId].x - featuresJSON[secondVerticesId].x);
						const differenceY = Math.abs(featuresJSON[firstVerticesId].y - featuresJSON[secondVerticesId].y);

						if (differenceX > differenceY) featuresJSON[firstVerticesId].y = featuresJSON[secondVerticesId].y;
						else featuresJSON[firstVerticesId].x = featuresJSON[secondVerticesId].x;

						if ((featuresJSON[firstVerticesId].x < featuresJSON[secondVerticesId].x) || (featuresJSON[firstVerticesId].y < featuresJSON[secondVerticesId].y)) {
							wallsJSON[key].coordinates.first = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
							wallsJSON[key].coordinates.second = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
						}
						else {
							wallsJSON[key].coordinates.first = [featuresJSON[secondVerticesId].x, featuresJSON[secondVerticesId].y];
							wallsJSON[key].coordinates.second = [featuresJSON[firstVerticesId].x, featuresJSON[firstVerticesId].y];
						}

						if (featuresJSON[firstVerticesId].x === featuresJSON[secondVerticesId].x)  wallsTMP.inner.vertical.push(wallsJSON[key]);
						else if (featuresJSON[firstVerticesId].y === featuresJSON[secondVerticesId].y) wallsTMP.inner.horizontal.push(wallsJSON[key]);

					}
				}
			}

			this.thickness = wallsTMP.horizontal[0].properties.thickness / 10;
			this.height = wallsTMP.horizontal[0].properties.height / 10;
			this.textureA = wallsTMP.horizontal[0].properties.textureA === 'stainless_steel' ? 'нержавейка' : 'сталь';
			this.textureB = wallsTMP.horizontal[0].properties.textureB === 'stainless_steel' ? 'нержавейка' : 'сталь';

			if (this.textureA === 'нержавейка') [this.textureA, this.textureB] = [this.textureB, this.textureA];

			if ((wallsTMP.horizontal.length === 2) && (wallsTMP.horizontal[0].coordinates.first[1] < wallsTMP.horizontal[1].coordinates.first[1])) {
				this.topWall = {
					x: 100,
					y: 100,
					length: wallsTMP.horizontal[0].properties.width,
					id: wallsTMP.horizontal[0].id,
					coordinates: wallsTMP.horizontal[0].coordinates,
					holes: wallsTMP.horizontal[0].holes,
					label: 'top'
				}
				this.bottomWall = {
					x: 100,
					y: 100 + wallsTMP.vertical[0].properties.width - this.thickness,
					length: wallsTMP.horizontal[1].properties.width,
					id: wallsTMP.horizontal[1].id,
					coordinates: wallsTMP.horizontal[1].coordinates,
					holes: wallsTMP.horizontal[1].holes,
					label: 'bottom'
				}
			}
			else if (wallsTMP.horizontal.length === 2) {
				this.topWall = {
					x: 100,
					y: 100,
					length: wallsTMP.horizontal[1].properties.width,
					id: wallsTMP.horizontal[1].id,
					coordinates: wallsTMP.horizontal[1].coordinates,
					holes: wallsTMP.horizontal[1].holes,
					label: 'top'
				}
				this.bottomWall = {
					x: 100,
					y: 100 + wallsTMP.vertical[0].properties.width - this.thickness,
					length: wallsTMP.horizontal[0].properties.width,
					id: wallsTMP.horizontal[0].id,
					coordinates: wallsTMP.horizontal[0].coordinates,
					holes: wallsTMP.horizontal[0].holes,
					label: 'bottom'
				}
			}

			if ((wallsTMP.horizontal.length === 2) && (this.topWall.length !== this.bottomWall.length)) {

				const topWallInt = Number.isInteger(this.topWall.length);
				const bottomWallInt = Number.isInteger(this.bottomWall.length);

				if (!topWallInt && bottomWallInt) this.topWall.length = this.bottomWall.length;
				else if (topWallInt && !bottomWallInt) this.bottomWall.length = this.topWall.length;
				else if (!topWallInt && !bottomWallInt) {

					const topWallLength = Math.round(this.topWall.length) - walls.thickness * 2;

					if (topWallLength % 10 === 0) {
						this.topWall.length = Math.round(this.topWall.length);
						this.bottomWall.length = this.topWall.length;
					}
					else {
						this.bottomWall.length = Math.round(this.bottomWall.length);
						this.topWall.length = this.bottomWall.length;
					}

				}
				else if (topWallInt && bottomWallInt) {
					if (((this.topWall.length - walls.thickness * 2) % 10 === 0) && ((this.bottomWall.length - walls.thickness * 2) % 10 !== 0)) this.bottomWall.length = this.topWall.length;
					else this.topWall.length = this.bottomWall.length;
				}

			}

			if ((wallsTMP.vertical.length === 2) && (wallsTMP.vertical[0].coordinates.first[0] < wallsTMP.vertical[1].coordinates.first[0])) {
				this.leftWall = {
					x: 100,
					y: 100,
					length: wallsTMP.vertical[0].properties.width,
					id: wallsTMP.vertical[0].id,
					coordinates: wallsTMP.vertical[0].coordinates,
					holes: wallsTMP.vertical[0].holes,
					label: 'left'
				}
				this.rightWall = {
					x: 100 + wallsTMP.horizontal[0].properties.width - this.thickness,
					y: 100,
					length: wallsTMP.vertical[1].properties.width,
					id: wallsTMP.vertical[1].id,
					coordinates: wallsTMP.vertical[1].coordinates,
					holes: wallsTMP.vertical[1].holes,
					label: 'right'
				}
			}
			else if (wallsTMP.vertical.length === 2) {
				this.leftWall = {
					x: 100,
					y: 100,
					length: wallsTMP.vertical[1].properties.width,
					id: wallsTMP.vertical[1].id,
					coordinates: wallsTMP.vertical[1].coordinates,
					holes: wallsTMP.vertical[1].holes,
					label: 'left'
				}
				this.rightWall = {
					x: 100 + wallsTMP.horizontal[0].properties.width - this.thickness,
					y: 100,
					length: wallsTMP.vertical[0].properties.width,
					id: wallsTMP.vertical[0].id,
					coordinates: wallsTMP.vertical[0].coordinates,
					holes: wallsTMP.vertical[0].holes,
					label: 'right'
				}
			}

			if ((wallsTMP.vertical.length === 2) && (this.leftWall.length !== this.rightWall.length)) {

				const leftWallInt = Number.isInteger(this.leftWall.length);
				const rightWallInt = Number.isInteger(this.rightWall.length);

				if (!leftWallInt && rightWallInt) this.leftWall.length = this.rightWall.length;
				else if (leftWallInt && !rightWallInt) this.rightWall.length = this.leftWall.length;
				else if (!leftWallInt && !rightWallInt) {

					const leftWallLength = Math.round(this.leftWall.length) - walls.thickness * 2;

					if (leftWallLength % 10 === 0) {
						this.leftWall.length = Math.round(this.leftWall.length);
						this.rightWall.length = this.leftWall.length;
					}
					else {
						this.rightWall.length = Math.round(this.rightWall.length);
						this.leftWall.length = this.rightWall.length;
					}

				}
				else if (leftWallInt && rightWallInt) {
					if (((this.leftWall.length - walls.thickness * 2) % 10 === 0) && ((this.rightWall.length - walls.thickness * 2) % 10 !== 0)) this.rightWall.length = this.leftWall.length;
					else this.leftWall.length = this.rightWall.length;
				}

			}

			function getLength(value) {
				const thisWallInt = Number.isInteger(value);
				let length = value;
				if (!thisWallInt) {
					const thisWallFloorLength = Math.floor(value);
					const thisWallCeilLength = Math.ceil(value);
					length = ((thisWallFloorLength - walls.thickness * 2) % 10 === 0) ? thisWallFloorLength : ((thisWallCeilLength - walls.thickness * 2) % 10 === 0) ? thisWallCeilLength : Math.round(value);
				}
				return length;
			}

			if (wallsTMP.vertical.length === 1) {

				let startsFromTopLeft = true;
				let startsFromTopRight = true;

				for (let i = 0; i < wallsTMP.vertical[0].coordinates.first.length; i++) {
					if (wallsTMP.vertical[0].coordinates.first[i] !== this.topWall.coordinates.first[i]) startsFromTopLeft = false;
				}

				for (let i = 0; i < wallsTMP.vertical[0].coordinates.first.length; i++) {
					if (wallsTMP.vertical[0].coordinates.first[i] !== this.topWall.coordinates.second[i]) startsFromTopRight = false;
				}
				
				if (startsFromTopLeft) {
					this.leftWall = {
						x: 100,
						y: 100,
						length: getLength(wallsTMP.vertical[0].properties.width),
						id: wallsTMP.vertical[0].id,
						coordinates: wallsTMP.vertical[0].coordinates,
						holes: wallsTMP.vertical[0].holes,
						label: 'left'
					}
				}
				else if (startsFromTopRight) {
					this.rightWall = {
						x: 100 + this.topWall.length - this.thickness,
						y: 100,
						length: getLength(wallsTMP.vertical[0].properties.width),
						id: wallsTMP.vertical[0].id,
						coordinates: wallsTMP.vertical[0].coordinates,
						holes: wallsTMP.vertical[0].holes,
						label: 'right'
					}
				}

			}
			else if (wallsTMP.horizontal.length === 1) {
				let startsFromTopLeft = true;
				let startsFromBottomLeft = true;

				for (let i = 0; i < wallsTMP.horizontal[0].coordinates.first.length; i++) {
					if (wallsTMP.horizontal[0].coordinates.first[i] !== this.leftWall.coordinates.first[i]) startsFromTopLeft = false;
				}

				for (let i = 0; i < wallsTMP.horizontal[0].coordinates.first.length; i++) {
					if (wallsTMP.horizontal[0].coordinates.first[i] !== this.leftWall.coordinates.second[i]) startsFromBottomLeft = false;
				}

				if (startsFromTopLeft) {
					this.topWall = {
						x: 100,
						y: 100,
						length: getLength(wallsTMP.horizontal[0].properties.width),
						id: wallsTMP.horizontal[0].id,
						coordinates: wallsTMP.horizontal[0].coordinates,
						holes: wallsTMP.horizontal[0].holes,
						label: 'top'
					}
				}
				else if (startsFromBottomLeft) {
					this.bottomWall = {
						x: 100,
						y: 100 + wallsTMP.vertical[0].properties.width - this.thickness,
						length: getLength(wallsTMP.horizontal[0].properties.width),
						id: wallsTMP.horizontal[0].id,
						coordinates: wallsTMP.horizontal[0].coordinates,
						holes: wallsTMP.horizontal[0].holes,
						label: 'bottom'
					}
				}
			}

			wallsTMP.inner.horizontal.forEach(wall => {
				this.innerWalls.horizontal.push({
					x: 100,
					y: 100 + wall.coordinates.first[1] - wallsTMP.vertical[0].coordinates.first[1],
					length: this.topWall ? this.topWall.length : this.bottomWall.length,
					id: wall.id,
					thickness: wall.properties.thickness / 10,
					holes: wall.holes,
					label: 'inner-horizontal'
				});
			});

			wallsTMP.inner.vertical.forEach(wall => {
				this.innerWalls.vertical.push({
					x: 100 + wall.coordinates.first[0] - wallsTMP.horizontal[0].coordinates.first[0],
					y: 100,
					length: this.leftWall ? this.leftWall.length : this.rightWall.length,
					id: wall.id,
					thickness: wall.properties.thickness / 10,
					holes: wall.holes,
					label: 'inner-vertical'
				});
			});

		}

	}

	const container = {
		setContainer() {
			this.width = walls.topWall ? walls.topWall.length + 200 : walls.bottomWall.length + 200;
			this.height = walls.leftWall ? walls.leftWall.length + 200 : walls.rightWall.length + 200;
		}
	}

	const lines = {
		setLines() {
			this.top = [100, 50, container.width - 200 + 100, 50];
			this.right = [container.width - 50, 100, container.width - 50, container.height - 200 + 100];
		}
	}

	const racks = {

		setRacks() {
			this.topLeft = {
				x: 100,
				y: 100
			}
			this.bottomLeft = {
				x: 100,
				y: walls.bottomWall ? walls.bottomWall.y : 100 + walls.leftWall.length - walls.thickness
			}
			this.topRight = {
				x: walls.rightWall ? walls.rightWall.x : 100 + walls.topWall.length - walls.thickness,
				y: 100
			}
			this.bottomRight = {
				x: walls.rightWall ? walls.rightWall.x : 100 + walls.bottomWall.length - walls.thickness,
				y: walls.rightWall ? 100 + walls.rightWall.length - walls.thickness : walls.bottomWall.y
			}
			this.size = walls.thickness;
		}

	}

	const holes = {

		basedoor: {
			horizontal: [],
			vertical: []
		},

		slidingdoor: {
			horizontal: [],
			vertical: []
		},

		containerdoor: {
			horizontal: [],
			vertical: []
		},

		doorway: {
			horizontal: [],
			vertical: []
		},
		
		tableNumbers: 1,

		setHoles() {

			for (let key in holesJSON) {

				const [wallId, type, holeId] = [holesJSON[key].line, holesJSON[key].type, key];

				for (let wall in walls) {

					if ((walls[wall].id === wallId) && ((wall === 'topWall') || (wall === 'bottomWall'))) {
						let direction = 'any';
						let offset = 'offsetA' in holesJSON[key].misc ? getOffsetAbsolute(holesJSON[key].misc.offsetA) : getOffsetAbsolute(holesJSON[key].misc.offsetB);
						if (holesJSON[key].properties.dver_block) direction = /^Левая/i.test(holesJSON[key].properties.dver_block) ? 'left' : 'right';
						this[type].horizontal.push({
							x: offset,
							y: walls[wall].y,
							length: type === 'doorway' ? getDoorwayProps(key).width : 120,
							thickness: walls.thickness,
							wall: (wall === 'topWall') ? 'top' : 'bottom',
							id: holeId,
							direction,
							label: holesJSON[key].properties.dver_block ? holesJSON[key].properties.dver_block : ''
						});
						break;
					}
					else if ((walls[wall].id === wallId) && ((wall === 'leftWall') || (wall === 'rightWall'))) {
						let direction = 'any';
						let offset = 'offsetA' in holesJSON[key].misc ? getOffsetAbsolute(holesJSON[key].misc.offsetA) : getOffsetAbsolute(holesJSON[key].misc.offsetB);
						if (holesJSON[key].properties.dver_block) direction = /^Левая/i.test(holesJSON[key].properties.dver_block) ? 'left' : 'right';
						this[type].vertical.push({
							x: walls[wall].x,
							y: offset,
							length: type === 'doorway' ? getDoorwayProps(key).width : 120,
							thickness: walls.thickness,
							wall: (wall === 'leftWall') ? 'left' : 'right',
							id: holeId,
							direction,
							label: holesJSON[key].properties.dver_block ? holesJSON[key].properties.dver_block : ''
						});
						break;
					}
					
				}

				walls.innerWalls.horizontal.forEach(wall => {
					if (wall.id === wallId) {
						let direction = 'any';
						let offset = 'offsetA' in holesJSON[key].misc ? getOffsetAbsolute(holesJSON[key].misc.offsetA) : getOffsetAbsolute(holesJSON[key].misc.offsetB);
						if (holesJSON[key].properties.dver_block) direction = /^Левая/i.test(holesJSON[key].properties.dver_block) ? 'left' : 'right';
						this[type].horizontal.push({
							x: offset,
							y: wall.y,
							length: type === 'doorway' ? getDoorwayProps(key, true).width : 120,
							thickness: wall.thickness,
							wall: 'inner',
							id: holeId,
							direction,
							label: holesJSON[key].properties.dver_block ? holesJSON[key].properties.dver_block : ''
						});
					}
				});

				walls.innerWalls.vertical.forEach(wall => {
					if (wall.id === wallId) {
						let direction = 'any';
						let offset = 'offsetA' in holesJSON[key].misc ? getOffsetAbsolute(holesJSON[key].misc.offsetA) : getOffsetAbsolute(holesJSON[key].misc.offsetB);
						if (holesJSON[key].properties.dver_block) direction = /^Левая/i.test(holesJSON[key].properties.dver_block) ? 'left' : 'right';
						this[type].vertical.push({
							x: wall.x,
							y: offset,
							length: type === 'doorway' ? getDoorwayProps(key, true).width : 120,
							thickness: wall.thickness,
							wall: 'inner',
							id: holeId,
							direction,
							label: holesJSON[key].properties.dver_block ? holesJSON[key].properties.dver_block : ''
						});
					}
				});

			}


		},

		countHoles() {

			const numberOfHoles = {
				outer: 0,
				inner: 0
			};

			const types = ['basedoor', 'slidingdoor', 'containerdoor'];

			for (let key of types) {
				this[key].horizontal.forEach(hole => {
					if (hole.wall === 'inner') numberOfHoles.inner++;
					else numberOfHoles.outer++;
				});
				this[key].vertical.forEach(hole => {
					if (hole.wall === 'inner') numberOfHoles.inner++;
					else numberOfHoles.outer++;
				});
			}

			return numberOfHoles;

		},

		countDoorways() {

			const outer = [];
			const inner = [];

			this.doorway.horizontal.forEach(hole => {
				if (hole.wall === 'inner') inner.push(getDoorwayProps(hole.id, inner).width);
				else outer.push(getDoorwayProps(hole.id).width);
			});
			this.doorway.vertical.forEach(hole => {
				if (hole.wall === 'inner') inner.push(getDoorwayProps(hole.id, inner).width);
				else outer.push(getDoorwayProps(hole.id).width);
			});

			return {outer, inner};

		},

		getTableHolesArray() {

			const data = [
				{
					type: 'basedoor',
					name: 'Дверной блок',
					indicator: 'Распашная',
					size: '800 X 1850',
					direction: '',
					count: 0
				},
				{
					type: 'basedoor',
					name: 'Дверной блок',
					indicator: 'Распашная',
					size: '900 X 1930',
					direction: '',
					count: 0
				},
				{
					type: 'slidingdoor',
					name: 'Дверной блок',
					indicator: 'Откатная',
					size: 'СП 1200 X 1850',
					direction: ', Л',
					count: 0
				},
				{
					type: 'slidingdoor',
					name: 'Дверной блок',
					indicator: 'Откатная',
					size: 'СП 1200 X 1850',
					direction: ', П',
					count: 0
				},
				{
					type: 'slidingdoor',
					name: 'Дверной блок',
					indicator: 'Откатная',
					size: '',
					direction: '',
					count: 0
				},
				{
					type: 'containerdoor',
					name: 'Дверной блок',
					indicator: 'Контейнерная',
					size: '',
					direction: ', Л',
					count: 0
				},
				{
					type: 'containerdoor',
					name: 'Дверной блок',
					indicator: 'Контейнерная',
					size: '',
					direction: ', П',
					count: 0
				},
				{
					type: 'containerdoor',
					name: 'Дверной блок',
					indicator: 'Контейнерная',
					size: '',
					direction: '',
					count: 0
				},
				{
					type: 'doorway',
					name: 'Проем',
					indicator: 'Световой проем',
					size: '',
					direction: '',
					count: 0
				}
			];

			const types = ['basedoor', 'slidingdoor', 'containerdoor', 'doorway'];

			for (let key of types) {

				this[key].horizontal.forEach(hole => {

					let newDoorway = false;

					for (const [i, item] of data.entries()) {

						if (item.type === 'slidingdoor' && item.type === key && item.direction === ', Л' && /^Левая/i.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'slidingdoor' && item.type === key && item.direction === ', П' && /^Правая/i.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'slidingdoor' && item.type === key && item.direction === '' && hole.label === '') {
							item.count++;
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === ', Л' && /^Левая/i.test(hole.label)) {
							item.count++;
							item.size = 'СП ' + hole.label.match(/\d+ ?[xх] ?\d+/i)[0];
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === ', П' && /^Правая/i.test(hole.label)) {
							item.count++;
							item.size = 'СП ' + hole.label.match(/\d+ ?[xх] ?\d+/i)[0];
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === '' && hole.label === '') {
							item.count++;
							break;
						}
						else if (item.type === 'basedoor' && item.type === key && item.size === '800 X 1850' && /800 ?. ?1850/.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'basedoor' && item.type === key && item.size === '900 X 1930' && /900 ?. ?1930/.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'doorway' && item.type === key) {
							const doorwayProps = hole.wall === 'inner' ? getDoorwayProps(hole.id, true) : getDoorwayProps(hole.id);
							const size = `СП ${doorwayProps.width * 10} X ${doorwayProps.height * 10}`;
							if (item.size === size) {
								item.count++;
								break;
							}
							if (i === data.length - 1) newDoorway = true;
						}
						
					}

					if (newDoorway) {
						const doorwayProps = hole.wall === 'inner' ? getDoorwayProps(hole.id, true) : getDoorwayProps(hole.id);
						const size = `СП ${doorwayProps.width * 10} X ${doorwayProps.height * 10}`;
						data.push({
							type: 'doorway',
							name: 'Проем',
							indicator: 'Световой проем',
							size,
							direction: '',
							count: 1
						});
					}

				});
				
				this[key].vertical.forEach(hole => {
					
					let newDoorway = false;
					
					for (const [i, item] of data.entries()) {

						if (item.type === 'slidingdoor' && item.type === key && item.direction === ', Л' && /^Левая/i.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'slidingdoor' && item.type === key && item.direction === ', П' && /^Правая/i.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'slidingdoor' && item.type === key && item.direction === '' && hole.label === '') {
							item.count++;
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === ', Л' && /^Левая/i.test(hole.label)) {
							item.count++;
							item.size = 'СП ' + hole.label.match(/\d+ ?[xх] ?\d+/i)[0];
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === ', П' && /^Правая/i.test(hole.label)) {
							item.count++;
							item.size = 'СП ' + hole.label.match(/\d+ ?[xх] ?\d+/i)[0];
							break;
						}
						else if (item.type === 'containerdoor' && item.type === key && item.direction === '' && hole.label === '') {
							item.count++;
							break;
						}
						else if (item.type === 'basedoor' && item.type === key && item.size === '800 X 1850' && /800 ?. ?1850/.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'basedoor' && item.type === key && item.size === '900 X 1930' && /900 ?. ?1930/.test(hole.label)) {
							item.count++;
							break;
						}
						else if (item.type === 'doorway' && item.type === key) {
							const doorwayProps = hole.wall === 'inner' ? getDoorwayProps(hole.id, true) : getDoorwayProps(hole.id);
							const size = `СП ${doorwayProps.width * 10} X ${doorwayProps.height * 10}`;
							if (item.size === size) {
								item.count++;
								break;
							}
							if (i === data.length - 1) newDoorway = true;
						}
						
					}

					if (newDoorway) {
						const doorwayProps = hole.wall === 'inner' ? getDoorwayProps(hole.id, true) : getDoorwayProps(hole.id);
						const size = `СП ${doorwayProps.width * 10} X ${doorwayProps.height * 10}`;
						data.push({
							type: 'doorway',
							name: 'Проем',
							indicator: 'Световой проем',
							size,
							direction: '',
							count: 1
						});
					}

				});
			}

			return data;

		}

	}

	const wallPanels = {

		innerWalls: {
			horizontal: [],
			vertical: []
		},
		numberOfTypesOuter: 0,
		numberOfTypesInner: 0,

		setWallPanels() {

			const sizes = [120, 90, 60, 30];

			if (walls.topWall && walls.topWall.holes.length === 0) {
				this.topWall = sizes.reduce((sum, current, i, array) => {
					const result = sum;
					let counter = 0;
					const numberOfPanels = Math.floor(result[1] / current);
					for (counter; counter < numberOfPanels; counter++) {
						result[0].push({
							start: {
								x: walls.topWall.x + walls.topWall.length - result[1] + current * counter - walls.thickness,
								y: 100
							},
							end: {
								x: walls.topWall.x + walls.topWall.length - result[1] + current * (counter + 1) - walls.thickness,
								y: 100
							},
							size: current
						});
					}
					result[1] = result[1] - current * counter;
					if (i < array.length - 1) return result;
					else if ((i === array.length - 1) && (result[1] > 0)) {
						result[0].push({
							start: {
								x: walls.topWall.x + walls.topWall.length - result[1] - walls.thickness,
								y: 100
							},
							end: {
								x: walls.topWall.x + walls.topWall.length - walls.thickness,
								y: 100
							},
							size: result[1]
						});
						return result[0];
					}
					else return result[0];
				}, [[], walls.topWall.length - walls.thickness * 2]);
			}
			else if (walls.topWall && walls.topWall.holes.length > 0) {
				this.topWall = configurer(walls.topWall, walls.thickness).reduce((sum, current, i, array) => {
					const result = sum;
					result[0].push({
						start: {
							x: walls.topWall.x + walls.thickness + result[1],
							y: 100
						},
						end: {
							x: walls.topWall.x + walls.thickness + current + result[1],
							y: 100
						},
						size: current
					});
					result[1] = result[1] += current;
					if (i < array.length - 1) return result;
					else return result[0];
				}, [[], 0]);
			}

			if (walls.bottomWall && walls.bottomWall.holes.length === 0) {
				this.bottomWall = sizes.reduce((sum, current, i, array) => {
					const result = sum;
					let counter = 0;
					const numberOfPanels = Math.floor(result[1] / current);
					for (counter; counter < numberOfPanels; counter++) {
						result[0].push({
							start: {
								x: walls.bottomWall.x + result[1] - current * (counter + 1) + walls.thickness,
								y: walls.bottomWall.y
							},
							end: {
								x: walls.bottomWall.x + result[1] - current * counter + walls.thickness,
								y: walls.bottomWall.y
							},
							size: current
						});
					}
					result[1] = result[1] - current * counter;
					if (i < array.length - 1) return result;
					else if ((i === array.length - 1) && (result[1] > 0)) {
						result[0].push({
							start: {
								x: walls.bottomWall.x + walls.thickness,
								y: walls.bottomWall.y
							},
							end: {
								x: walls.bottomWall.x + result[1] + walls.thickness,
								y: walls.bottomWall.y
							},
							size: result[1]
						});
						return result[0];
					}
					else return result[0];
				}, [[], walls.bottomWall.length - walls.thickness * 2]);
			}
			else if (walls.bottomWall && walls.bottomWall.holes.length > 0) {
				this.bottomWall = configurer(walls.bottomWall, walls.thickness).reduce((sum, current, i, array) => {
					const result = sum;
					result[0].push({
						start: {
							x: walls.bottomWall.x + walls.thickness + result[1],
							y: walls.bottomWall.y
						},
						end: {
							x: walls.bottomWall.x + walls.thickness + current + result[1],
							y: walls.bottomWall.y
						},
						size: current
					});
					result[1] = result[1] += current;
					if (i < array.length - 1) return result;
					else return result[0];
				}, [[], 0]);
			}

			if (walls.rightWall && walls.rightWall.holes.length === 0) {
				this.rightWall = sizes.reduce((sum, current, i, array) => {
					const result = sum;
					let counter = 0;
					const numberOfPanels = Math.floor(result[1] / current);
					for (counter; counter < numberOfPanels; counter++) {
						result[0].push({
							start: {
								x: walls.rightWall.x,
								y: walls.rightWall.y + walls.rightWall.length - result[1] + current * counter - walls.thickness
							},
							end: {
								x: walls.rightWall.x,
								y: walls.rightWall.y + walls.rightWall.length - result[1] + current * (counter + 1) - walls.thickness
							},
							size: current
						});
					}
					result[1] = result[1] - current * counter;
					if (i < array.length - 1) return result;
					else if ((i === array.length - 1) && (result[1] > 0)) {
						result[0].push({
							start: {
								x: walls.rightWall.x,
								y: walls.rightWall.y + walls.rightWall.length - result[1] - walls.thickness
							},
							end: {
								x: walls.rightWall.x,
								y: walls.rightWall.y + walls.rightWall.length - walls.thickness
							},
							size: result[1]
						});
						return result[0];
					}
					else return result[0];
				}, [[], walls.rightWall.length - walls.thickness * 2]);
			}
			else if (walls.rightWall && walls.rightWall.holes.length > 0) {
				this.rightWall = configurer(walls.rightWall, walls.thickness).reduce((sum, current, i, array) => {
					const result = sum;
					result[0].push({
						start: {
							x: walls.rightWall.x,
							y: walls.rightWall.y + walls.thickness + result[1]
						},
						end: {
							x: walls.rightWall.x,
							y: walls.rightWall.y + walls.thickness + current + result[1]
						},
						size: current
					});
					result[1] = result[1] += current;
					if (i < array.length - 1) return result;
					else return result[0];
				}, [[], 0]);
			}


			if (walls.leftWall && walls.leftWall.holes.length === 0) {
				this.leftWall = sizes.reduce((sum, current, i, array) => {
					const result = sum;
					let counter = 0;
					const numberOfPanels = Math.floor(result[1] / current);
					for (counter; counter < numberOfPanels; counter++) {
						result[0].push({
							start: {
								x: 100,
								y: walls.leftWall.y + result[1] - current * (counter + 1) + walls.thickness
							},
							end: {
								x: 100,
								y: walls.leftWall.x + result[1] - current * counter + walls.thickness
							},
							size: current
						});
					}
					result[1] = result[1] - current * counter;
					if (i < array.length - 1) return result;
					else if ((i === array.length - 1) && (result[1] > 0)) {
						result[0].push({
							start: {
								x: 100,
								y: walls.leftWall.y + walls.thickness
							},
							end: {
								x: 100,
								y: walls.leftWall.y + result[1] + walls.thickness
							},
							size: result[1]
						});
						return result[0];
					}
					else return result[0];
				}, [[], walls.leftWall.length - walls.thickness * 2]);
			}
			else if (walls.leftWall && walls.leftWall.holes.length > 0) {
				this.leftWall = configurer(walls.leftWall, walls.thickness).reduce((sum, current, i, array) => {
					const result = sum;
					result[0].push({
						start: {
							x: 100,
							y: walls.leftWall.y + walls.thickness + result[1]
						},
						end: {
							x: 100,
							y: walls.leftWall.y + walls.thickness + current + result[1]
						},
						size: current
					});
					result[1] = result[1] += current;
					if (i < array.length - 1) return result;
					else return result[0];
				}, [[], 0]);
			}

			walls.innerWalls.horizontal.forEach(wall => {

				if (wall.holes.length === 0) {
					this.innerWalls.horizontal.push(
						sizes.reduce((sum, current, i, array) => {
							const result = sum;
							let counter = 0;
							const numberOfPanels = Math.floor(result[1] / current);
							for (counter; counter < numberOfPanels; counter++) {
								result[0].push({
									start: {
										x: wall.x + wall.length - result[1] + current * counter - walls.thickness,
										y: wall.y
									},
									end: {
										x: wall.x + wall.length - result[1] + current * (counter + 1) - walls.thickness,
										y: wall.y
									},
									size: current
								});
							}
							result[1] = result[1] - current * counter;
							if (i < array.length - 1) return result;
							else if ((i === array.length - 1) && (result[1] > 0)) {
								result[0].push({
									start: {
										x: wall.x + wall.length - result[1] - walls.thickness,
										y: wall.y
									},
									end: {
										x: wall.x + wall.length - walls.thickness,
										y: wall.y
									},
									size: result[1]
								});
								return result[0];
							}
							else return result[0];
						}, [[], wall.length - walls.thickness * 2])
					);
				}
				else {
					this.innerWalls.horizontal.push(
						configurer(wall, walls.thickness).reduce((sum, current, i, array) => {
							const result = sum;
							result[0].push({
								start: {
									x: wall.x + walls.thickness + result[1],
									y: wall.y
								},
								end: {
									x: wall.x + walls.thickness + current + result[1],
									y: wall.y
								},
								size: current
							});
							result[1] += current;
							if (i < array.length - 1) return result;
							else return result[0];
						}, [[], 0])
					);
				}

			});

			walls.innerWalls.vertical.forEach(wall => {

				if (wall.holes.length === 0) {
					this.innerWalls.vertical.push(
						sizes.reduce((sum, current, i, array) => {
							const result = sum;
							let counter = 0;
							const numberOfPanels = Math.floor(result[1] / current);
							for (counter; counter < numberOfPanels; counter++) {
								result[0].push({
									start: {
										x: wall.x,
										y: wall.y + wall.length - result[1] + current * counter - walls.thickness
									},
									end: {
										x: wall.x,
										y: wall.y + wall.length - result[1] + current * (counter + 1) - walls.thickness
									},
									size: current
								});
							}
							result[1] = result[1] - current * counter;
							if (i < array.length - 1) return result;
							else if ((i === array.length - 1) && (result[1] > 0)) {
								result[0].push({
									start: {
										x: wall.x,
										y: wall.y + wall.length - result[1] - walls.thickness
									},
									end: {
										x: wall.x,
										y: wall.y + wall.length - walls.thickness
									},
									size: result[1]
								});
								return result[0];
							}
							else return result[0];
						}, [[], wall.length - walls.thickness * 2])
					);
				}
				else {
					this.innerWalls.vertical.push(
						configurer(wall, walls.thickness).reduce((sum, current, i, array) => {
							const result = sum;
							result[0].push({
								start: {
									x: wall.x,
									y: wall.y + walls.thickness + result[1]
								},
								end: {
									x: wall.x,
									y: wall.y + walls.thickness + current + result[1]
								},
								size: current
							});
							result[1] += current;
							if (i < array.length - 1) return result;
							else return result[0];
						}, [[], 0])
					);
				}

			});

		},

		countWallPanels() {

			const {outer: outerDoorways, inner: innerDoorways} = holes.countDoorways();
			const outerPanels = [];
			const innerPanels = [];
			let outerHoles = holes.countHoles().outer;
			let innerHoles = holes.countHoles().inner;

			function outerPanelsCounter(wall) {
				wall.forEach(panel => {

					switch (outerPanels.length) {
						case 0:
							if (panel.size === 120 && outerHoles > 0) outerHoles--;
							else if (outerDoorways.includes(panel.size)) outerDoorways.splice(outerDoorways.indexOf(panel.size), 1);
							else {
								outerPanels.push({
									width: panel.size,
									height: walls.height,
									count: 1,
									type: panel.size >= 30 ? 'Стандартная' : 'Нестандартная'
								});
							}
							break;
						default:
							if (panel.size === 120 && outerHoles > 0) outerHoles--;
							else if (outerDoorways.includes(panel.size)) outerDoorways.splice(outerDoorways.indexOf(panel.size), 1);
							else {
								let match = false;
								for (let type in outerPanels) {
									if (outerPanels[type].width === panel.size) {
										outerPanels[type].count++;
										match = true;
										break;
									}
								}
								if (!match) {
									outerPanels.push({
										width: panel.size,
										height: walls.height,
										count: 1,
										type: panel.size >= 30 ? 'Стандартная' : 'Нестандартная'
									});
								}
							}
					}
				});
			}

			function innerPanelsCounter(wall) {
				wall.forEach(panel => {

					switch (innerPanels.length) {
						case 0:
							if (panel.size === 120 && innerHoles > 0) innerHoles--;
							else if (innerDoorways.includes(panel.size)) innerDoorways.splice(innerDoorways.indexOf(panel.size), 1);
							else {
								innerPanels.push({
									width: panel.size,
									height: walls.height,
									count: 1,
									type: panel.size >= 30 ? 'Стандартная' : 'Нестандартная'
								});
							}
							break;
						default:
							if (panel.size === 120 && innerHoles > 0) innerHoles--;
							else if (innerDoorways.includes(panel.size)) innerDoorways.splice(innerDoorways.indexOf(panel.size), 1);
							else {
								let match = false;
								for (let type in innerPanels) {
									if (innerPanels[type].width === panel.size) {
										innerPanels[type].count++;
										match = true;
										break;
									}
								}
								if (!match) {
									innerPanels.push({
										width: panel.size,
										height: walls.height,
										count: 1,
										type: panel.size >= 30 ? 'Стандартная' : 'Нестандартная'
									});
								}
							}
					}
				});
			}

			if (this.topWall) outerPanelsCounter(this.topWall);
			if (this.bottomWall) outerPanelsCounter(this.bottomWall);
			if (this.leftWall) outerPanelsCounter(this.leftWall);
			if (this.rightWall) outerPanelsCounter(this.rightWall);
			this.innerWalls.horizontal.forEach(wall => innerPanelsCounter(wall));
			this.innerWalls.vertical.forEach(wall => innerPanelsCounter(wall));

			this.numberOfTypesOuter = outerPanels.length;
			this.numberOfTypesInner = innerPanels.length;

			return { outerPanels, innerPanels };

		}

	}

	const ceilingPanels = {

		panels: [],
		numberOfTypes: 0,

		setCeilingPanels() {

			const sizes = [120, 90, 60, 30];
			const sidePanelTypes = walls.thickness === 8 ? [98, 68] : [100, 70];
			const sidePanel = Math.floor((container.width - 200) / (sidePanelTypes[0] * 2)) >= 1 ? sidePanelTypes[0] : sidePanelTypes[1];
			let freeSpace = container.width - 200 - sidePanel * 2;

			this.panels.push({
				x: 100,
				y: 100,
				width: sidePanel,
				height: container.height - 200
			});

			sizes.forEach(size => {
				const numberOfPanels = Math.floor(freeSpace / size);
				for (let i = 0; i < numberOfPanels; i++) {
					this.panels.push({
						x: container.width - 100 - sidePanel - freeSpace,
						y: 100,
						width: size,
						height: container.height - 200
					});
					freeSpace -= size;
				}
			});

			if (freeSpace) {
				this.panels.push({
					x: container.width - 100 - sidePanel - freeSpace,
					y: 100,
					width: freeSpace,
					height: container.height - 200
				});
			}


			this.panels.push({
				x: container.width - 100 - sidePanel,
				y: 100,
				width: sidePanel,
				height: container.height - 200
			});

		},

		countCeilingPanels() {

			const panels = [];

			this.panels.forEach((panel, i) => {

				if (i === 0) {
					panels.push({
						width: panel.width,
						height: panel.height,
						count: 2,
						type: panel.height <= 256 ? 'Стандартная' : 'Нестандартная'
					});
				}
				else if (i > 0 && i < this.panels.length - 1) {
					let match = false;
					for (let type in panels) {
						if (panels[type].width === panel.width) {
							panels[type].count++;
							match = true;
							break;
						}
					}
					if (!match) {
						panels.push({
							width: panel.width,
							height: panel.height,
							count: 1,
							type: (panel.width % 30 === 0 && panel.height <= 256) ? 'Стандартная' : 'Нестандартная'
						});
					}
				}

			});

			this.numberOfTypes = panels.length;

			return panels;

		}

	}

	const floorPanels = {

		panels: [],
		numberOfTypes: 0,
		texture: 0,

		countFloorPanels() {

			if (!('areas' in json.layers['layer-1'])) return;
			const areas = json.layers['layer-1'].areas;
			for (let area in areas) {
				if (('name' in areas[area]) && areas[area].name === 'Пол' && ('properties' in areas[area]) && ('texture' in areas[area].properties) && (areas[area].properties.texture !== 'none')) {
					this.panels = ceilingPanels.countCeilingPanels();
					this.numberOfTypes = this.panels.length;
					this.texture = areas[area].properties.texture === 'stainless_steel' ? 'сталь - нержавейка' : 'сталь - сталь';
				}
			}

		}

	}

	const archPanels = {

		panels: [],
		
		countArchPanels() {

			for (let type in holes) {
				let doorPanelExists = false;

				switch (type) {
					case 'containerdoor':

						if (walls.height <= 185) continue;

						const containerdoors = holes.containerdoor.horizontal.length + holes.containerdoor.vertical.length;

						if (!containerdoors) continue;

						if (!this.panels.length) this.panels.push({
							count: containerdoors,
							name: 'Панель-арка',
							size: `1200 X ${(walls.height - 185) * 10}`,
							label: 'doorPanel'
						});
						else this.panels.forEach((panel, i) => {
							if (!doorPanelExists && panel.label === 'doorPanel') {
								panel.count += containerdoors;
								doorPanelExists = true;
							}
							else if (!doorPanelExists && i === this.panels.length - 1) this.panels.push({
								count: containerdoors,
								name: 'Панель-арка',
								size: `1200 X ${(walls.height - 185) * 10}`,
								label: 'doorPanel'
							});
						});

					break;
					case 'slidingdoor':

						if (walls.height <= 185) continue;

						const slidingdoors = holes.slidingdoor.horizontal.length + holes.slidingdoor.vertical.length;

						if (!slidingdoors) continue;

						if (!this.panels.length) this.panels.push({
							count: slidingdoors,
							name: 'Панель-арка',
							size: `1200 X ${(walls.height - 185) * 10}`,
							label: 'doorPanel'
						});
						else this.panels.forEach(panel => {

							if (!doorPanelExists && panel.label === 'doorPanel') {
								panel.count += slidingdoors;
								doorPanelExists = true;
							}
							else if (!doorPanelExists && i === this.panels.length - 1) this.panels.push({
								count: slidingdoors,
								name: 'Панель-арка',
								size: `1200 X ${(walls.height - 185) * 10}`,
								label: 'doorPanel'
							});

						});

					break;
					case 'doorway':

						for (const doorway of holes.doorway.horizontal) {

							const {width, height} = doorway.wall === 'inner' ? getDoorwayProps(doorway.id, true) : getDoorwayProps(doorway.id);
							let doorwayHPanelExists = false;
							
							if (height >= walls.height) continue;

							const panelHeight = walls.height - height;

							if (!this.panels.length) this.panels.push({
								count: 1,
								name: 'Панель-арка',
								size: `${width * 10} X ${panelHeight * 10}`,
								label: 'doorwayPanel'
							});
							else this.panels.forEach((panel, i) => {
								if (!doorwayHPanelExists && panel.label === 'doorwayPanel' && panel.size === `${width * 10} X ${panelHeight * 10}`) {
									panel.count += 1;
									doorwayHPanelExists = true;
								}
								else if (!doorwayHPanelExists && i === this.panels.length - 1) this.panels.push({
									count: 1,
									name: 'Панель-арка',
									size: `${width * 10} X ${panelHeight * 10}`,
									label: 'doorwayPanel'
								});
							});

						}

						for (const doorway of holes.doorway.vertical) {

							const {width, height} = doorway.wall === 'inner' ? getDoorwayProps(doorway.id, true) : getDoorwayProps(doorway.id);
							let doorwayVPanelExists = false;

							if (height >= walls.height) continue;

							const panelHeight = walls.height - height;

							if (!this.panels.length) this.panels.push({
								count: 1,
								name: 'Панель-арка',
								size: `${width * 10} X ${panelHeight * 10}`,
								label: 'doorwayPanel'
							});
							else this.panels.forEach((panel, i) => {
								if (!doorwayVPanelExists && panel.label === 'doorwayPanel' && panel.size === `${width * 10} X ${panelHeight * 10}`) {
									panel.count += 1;
									doorwayVPanelExists = true;
								}
								else if (!doorwayVPanelExists && i === this.panels.length - 1) this.panels.push({
									count: 1,
									name: 'Панель-арка',
									size: `${width * 10} X ${panelHeight * 10}`,
									label: 'doorwayPanel'
								});
							});
						}

					break;
				}

			}

		}

	}

	walls.setWalls();
	container.setContainer();
	lines.setLines();
	racks.setRacks();
	holes.setHoles();
	wallPanels.setWallPanels();
	ceilingPanels.setCeilingPanels();
	floorPanels.countFloorPanels();
	archPanels.countArchPanels();

	/* Проверка входящих данных>> */
	if ((container.width - 200) > 566 && (container.height - 200) > 566) return {error: 'превышены максмально допустимые габариты камеры'};
	/* <<Проверка входящих данных */

	const tableLeft = `
		<table class="document__tableLeft" rules="all">
			<tr>
				<td class="document__tableLeftCell" height="80px"></td>
				<td class="document__tableLeftCell" height="80px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="80px"></td>
				<td class="document__tableLeftCell" height="80px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="130px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl">Артикул</td>
				<td class="document__tableLeftCell" height="130px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="180px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl">Подпись и дата</td>
				<td class="document__tableLeftCell" height="180px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="130px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl"><p>Заказчик</td>
				<td class="document__tableLeftCell" height="130px"></td>
			</tr>
		</table>
	`;

	const svg = `
		<svg class="document__svg" width="${container.width}" height="${container.height}" style="transform: scale(${yMirror ? ("1, -1") : 1})" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<defs>

				<marker id="arrowLeft" markerWidth="10" markerHeight="10" refX="0" refY="5">
					<polygon points="0 5, 10 7.5, 10 2.5"/>	
				</marker>
				<marker id="arrowRight" markerWidth="10" markerHeight="10" refX="10" refY="5">
					<polygon points="0 2.5, 10 5, 0 7.5"/>	
				</marker>
				<marker id="arrowTop" markerWidth="10" markerHeight="10" refX="5" refY="0">
					<polygon points="5 0, 2.5 10, 7.5 10"/>	
				</marker>
				<marker id="arrowBottom" markerWidth="10" markerHeight="10" refX="5" refY="10">
					<polygon points="5 10, 2.5 0, 7.5 0"/>	
				</marker>

				<path id="topTextPath" d="M${lines.top[0]} ${lines.top[1] - 10}, L${lines.top[2]} ${lines.top[3] - 10}"/>
				<path id="rightTextPath" d="M${lines.right[0] + 10} ${lines.right[1]}, L${lines.right[2] + 10} ${lines.right[3]}"/>

				<pattern id="holePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
					<rect x="0" y="0" width="8" height="8" fill="white"/>
					<path d="M0 0 L8 8, M8 0, 0 8" stroke="black"/>
				</pattern>

			</defs>

			${(ceilingPanels.panels.map(panel => `<rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" fill="${panel.width < 30 ? "rgb(250, 127, 137)" : "none"}" stroke="black"/>`)).join('')}

			${racks.topLeft ? `<rect x="${racks.topLeft.x}" y="${racks.topLeft.y}" width="${racks.size}" height="${racks.size}" fill="white" stroke="black"/>` : ""}
			${racks.bottomLeft ? `<rect x="${racks.bottomLeft.x}" y="${racks.bottomLeft.y}" width="${racks.size}" height="${racks.size}" fill="white" stroke="black"/>` : ""}
			${racks.topRight ? `<rect x="${racks.topRight.x}" y="${racks.topRight.y}" width="${racks.size}" height="${racks.size}" fill="white" stroke="black"/>` : ""}
			${racks.bottomRight ? `<rect x="${racks.bottomRight.x}" y="${racks.bottomRight.y}" width="${racks.size}" height="${racks.size}" fill="white" stroke="black"/>` : ""}

			${wallPanels.topWall ? (wallPanels.topWall.map(panel => `<rect x="${panel.start.x}" y="${panel.start.y}" width="${panel.size}" height="${walls.thickness}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`)).join('') : ""}
			${wallPanels.bottomWall ? (wallPanels.bottomWall.map(panel => `<rect x="${panel.start.x}" y="${panel.start.y}" width="${panel.size}" height="${walls.thickness}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`)).join('') : ""}
			${wallPanels.rightWall ? (wallPanels.rightWall.map(panel => `<rect x="${panel.start.x}" y="${panel.start.y}" width="${walls.thickness}" height="${panel.size}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`)).join('') : ""}
			${wallPanels.leftWall ? (wallPanels.leftWall.map(panel => `<rect x="${panel.start.x}" y="${panel.start.y}" width="${walls.thickness}" height="${panel.size}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`)).join('') : ""}
			${(wallPanels.innerWalls.horizontal.map(wall => {
				return (wall.map(panel => `
					<rect x="${panel.start.x}" y="${panel.start.y}" width="${panel.size}" height="${walls.thickness}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`
				)).join('')
			})).join('')}
			${(wallPanels.innerWalls.vertical.map(wall => {
				return (wall.map(panel => `
					<rect x="${panel.start.x}" y="${panel.start.y}" width="${walls.thickness}" height="${panel.size}" fill="${panel.size >= 30 ? 'rgb(202, 248, 201)' : 'rgb(250, 127, 137)'}" stroke="black"/>`
				)).join('')
			})).join('')}

			${(holes.basedoor.horizontal.map(door => {
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.length}" height="${door.thickness}"/>
						<rect x="${door.x + 5}" y="${(door.wall === 'top') ? door.y - door.thickness / 2 : door.y + door.thickness}" width="${door.length - 10}" height="${door.thickness / 2}"/>
					</g>`
			})).join('')}

			${(holes.basedoor.vertical.map(door => {
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.thickness}" height="${door.length}"/>
						<rect x="${(door.wall === 'left') ? door.x - door.thickness / 2 : door.x + door.thickness}" y="${door.y + 5}" width="${door.thickness / 2}" height="${door.length - 10}"/>
					</g>`
			})).join('')}

			${(holes.slidingdoor.horizontal.map(door => {
				let arrow = 'marker-start="url(#arrowLeft)';
				if ((door.wall === 'top' || door.wall === 'inner') && door.direction === 'left') arrow = 'marker-start="url(#arrowLeft)';
				else if ((door.wall === 'top' || door.wall === 'inner') && door.direction === 'right') arrow = 'marker-end="url(#arrowRight)';
				else if (door.wall === 'bottom' && door.direction === 'right') arrow = 'marker-start="url(#arrowLeft)';
				else if (door.wall === 'bottom' && door.direction === 'left') arrow = 'marker-end="url(#arrowRight)';
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.length}" height="${door.thickness}"/>
						<rect x="${door.x + 5}" y="${(door.wall === 'top') ? door.y - door.thickness / 2 : door.y + door.thickness}" width="${door.length - 10}" height="${door.thickness / 2}"/>
						<line x1="${door.x + 5}" y1="${(door.wall === 'top') ? door.y - door.thickness * 1.5 : door.y + door.thickness * 2.5}" x2="${door.x + door.length - 5}" y2="${(door.wall === 'top') ? door.y - door.thickness * 1.5 : door.y + door.thickness * 2.5}" ${arrow}"/>
					</g>`
			})).join('')}

			${(holes.slidingdoor.vertical.map(door => {
				let arrow = 'marker-start="url(#arrowTop)';
				if ((door.wall === 'right' || door.wall === 'inner') && door.direction === 'left') arrow = 'marker-start="url(#arrowTop)';
				else if ((door.wall === 'right' || door.wall === 'inner') && door.direction === 'right') arrow = 'marker-end="url(#arrowBottom)';
				else if (door.wall === 'left' && door.direction === 'left') arrow = 'marker-end="url(#arrowBottom)';
				else if (door.wall === 'left' && door.direction === 'right') arrow = 'marker-start="url(#arrowTop)';
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.thickness}" height="${door.length}"/>
						<rect x="${(door.wall === 'left') ? door.x - door.thickness / 2 : door.x + door.thickness}" y="${door.y + 5}" width="${door.thickness / 2}" height="${door.length - 10}"/>
						<line x1="${(door.wall === 'left') ? door.x - door.thickness * 1.5 : door.x + door.thickness * 2.5}" y1="${door.y + 5}" x2="${(door.wall === 'left') ? door.x - door.thickness * 1.5 : door.x + door.thickness * 2.5}" y2="${door.y + door.length - 5}" ${arrow}"/>
					</g>`
			})).join('')}

			${(holes.containerdoor.horizontal.map(door => {
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.length}" height="${door.thickness}"/>
						<line x1="${door.x + 4}" y1="${door.y}" x2="${door.x + 4}" y2="${door.y + door.thickness}" stroke-width="2"/>
						<line x1="${door.x + door.length - 4}" y1="${door.y}" x2="${door.x + door.length - 4}" y2="${door.y + door.thickness}" stroke-width="2"/>
						<rect x="${door.x + 5}" y="${(door.wall === 'top') ? door.y - door.thickness / 2 : door.y + door.thickness}" width="${door.length - 10}" height="${door.thickness / 2}"/>
					</g>`
			})).join('')}

			${(holes.containerdoor.vertical.map(door => {
				return `
					<g fill="white" stroke="black">
						<rect x="${door.x}" y="${door.y}" width="${door.thickness}" height="${door.length}"/>
						<line x1="${door.x}" y1="${door.y + 4}" x2="${door.x + door.thickness}" y2="${door.y + 4}" stroke-width="2"/>
						<line x1="${door.x}" y1="${door.y + door.length - 4}" x2="${door.x + door.thickness}" y2="${door.y + door.length - 4}" stroke-width="2"/>
						<rect x="${(door.wall === 'left') ? door.x - door.thickness / 2 : door.x + door.thickness}" y="${door.y + 5}" width="${door.thickness / 2}" height="${door.length - 10}"/>
					</g>`
			})).join('')}

			${(holes.doorway.horizontal.map(door => {
				return `
					<g>
						<rect x="${door.x}" y="${door.y}" width="${door.length}" height="${door.thickness}" fill="url(#holePattern)"/>
						<path d="M${door.x} ${door.y} L${door.x} ${door.y + door.thickness} M${door.x + door.length} ${door.y} L${door.x + door.length} ${door.y + door.thickness}" stroke="black">
					</g>`
			})).join('')}

			${(holes.doorway.vertical.map(door => {
				return `
					<g>
						<rect x="${door.x}" y="${door.y}" width="${door.thickness}" height="${door.length}" fill="url(#holePattern)"/>
						<path d="M${door.x} ${door.y} L${door.x + door.thickness} ${door.y} M${door.x} ${door.y + door.length} L${door.x + door.thickness} ${door.y + door.length}" stroke="black">
					</g>`
			})).join('')}

			${wallPanels.topWall ? (wallPanels.topWall.map(panel => `<text x="${panel.start.x}" dx="${panel.size / 2 - 7}" y="${panel.start.y - 10}" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y + walls.thickness * 2) - panel.start.y + 10})"` : ""}>${panel.size * 10}</text>`)).join('') : ""}
			${wallPanels.bottomWall ? (wallPanels.bottomWall.map(panel => `<text x="${panel.start.x}" dx="${panel.size / 2 - 7}" y="${panel.start.y + walls.thickness + 20}" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y - walls.thickness) - panel.start.y - 40})"` : ""}>${panel.size * 10}</text>`)).join('') : ""}
			${wallPanels.leftWall ? (wallPanels.leftWall.map(panel => `<text x="${panel.start.x - 10}" y="${panel.start.y - 15 + walls.thickness}" dy="${panel.size / 2 + 10}" font-size="10" text-anchor="end" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y - panel.size) - panel.start.y})"` : ""}>${panel.size * 10}</text>`)).join('') : ""}
			${wallPanels.rightWall ? (wallPanels.rightWall.map(panel => `<text x="${panel.start.x + walls.thickness + 10}" y="${panel.start.y - 15 + walls.thickness}" dy="${panel.size / 2 + 7}" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y - panel.size) - panel.start.y})"` : ""}>${panel.size * 10}</text>`)).join('') : ""}
			${(wallPanels.innerWalls.horizontal.map(wall =>
				(wall.map(panel => `
					<text x="${panel.start.x}" dx="${panel.size / 2 - 7}" y="${panel.start.y - 10}" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y) - panel.start.y - 10})"` : ""}>${panel.size * 10}</text>`
				)).join('')
			)).join('')}
			${(wallPanels.innerWalls.vertical.map(wall =>
				(wall.map(panel => `
					<text x="${panel.start.x + 19}" y="${panel.start.y - 15 + walls.thickness}" dy="${panel.size / 2 + 7}" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1) translate(0, ${(container.height - panel.start.y - panel.size) - panel.start.y})"` : ""}>${panel.size * 10}</text>`
				)).join('')
			)).join('')}

			${(ceilingPanels.panels.map(panel => `<text x="${panel.x + panel.width / 2}" y="${container.height / 2}" dx="-7" font-size="10" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1)"` : ""}>${panel.width * 10}</text>`)).join('')}

			<line x1="${lines.top[0]}" y1="${lines.top[1]}" x2="${lines.top[2]}" y2="${lines.top[3]}" stroke="black" marker-start="url(#arrowLeft)" marker-end="url(#arrowRight)" ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1)"` : ""}/>
			<text ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1)"` : ""}>
				<textPath startOffset="45%" font-size="10" xlink:href="#topTextPath">${(container.width - 200) * 10} mm</textPath>
			</text>

			<line x1="${lines.right[0]}" y1="${lines.right[1]}" x2="${lines.right[2]}" y2="${lines.right[3]}" stroke="black" marker-start="url(#arrowTop)" marker-end="url(#arrowBottom)"/>
			<text ${yMirror ? `transform="translate(0, ${container.height}) scale(1, -1)"` : ""}>
				<textPath startOffset="45%" font-size="10" xlink:href="#rightTextPath">${(container.height - 200) * 10} mm</textPath>
			</text>

		</svg>
	`;

	const svgURI = "data:image/svg+xml," + encodeURI(svg).replace(/#/g, '%23');

	const summary = `<p class="document__summary">КХН - ${(((container.width - 200 - walls.thickness * 2) / 100) * ((container.height - 200 - walls.thickness * 2) / 100) * (walls.height / 100)).toFixed(2)} (${(container.height - 200) * 10} X ${(container.width - 200) * 10} X ${(walls.height + walls.thickness * 2) * 10})</p>`;

	const tableCommon = `
		<div class="document__common">

			<div class="document__commonRow">
				<p class="document__commonText">Глубина х Длина х Высота (мм)</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">${(container.height - 200) * 10} x ${(container.width - 200) * 10} x ${(walls.height + walls.thickness * 2) * 10}</p>
			</div>

			<div class="document__commonRow">
				<p class="document__commonText">Объем (м3)</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">${(((container.width - 200 - walls.thickness * 2) / 100) * ((container.height - 200 - walls.thickness * 2) / 100) * (walls.height / 100)).toFixed(2)}</p>
			</div>

			<div class="document__commonRow">
				<p class="document__commonText">Площадь (м2)</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">
					${
						ceilingPanels.countCeilingPanels().reduce((sum, panel) => {
							let result = sum;
							result += (panel.count * ((panel.width / 100) * (panel.height / 100)));
							return Number(result.toFixed(2));
						}, 0)
					}
				</p>
			</div>

			<div class="document__commonRow">
				<p class="document__commonText">Потолочные панели (м2)</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">
					${
						ceilingPanels.countCeilingPanels().reduce((sum, panel) => {
							let result = sum;
							result += (panel.count * ((panel.width / 100) * (panel.height / 100)));
							return Number(result.toFixed(2));
						}, 0)
					}
				</p>
			</div>

			${
				floorPanels.panels.length ? 
				`<div class="document__commonRow">
					<p class="document__commonText">Половые панели (м2)</p>
					<div class="document__commonUnderline"></div>
					<p class="document__commonText" align="right">
						${
							floorPanels.panels.reduce((sum, panel) => {
								let result = sum;
								result += (panel.count * ((panel.width / 100) * (panel.height / 100)));
								return Number(result.toFixed(2));
							}, 0)
						}
					</p>
				</div>`
				: ""
			}

			<div class="document__commonRow">
				<p class="document__commonText">Облицовка стеновых панелей</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">${walls.textureA} - ${walls.textureB}</p>
			</div>

			<div class="document__commonRow">
				<p class="document__commonText">Облицовка потолочных панелей</p>
				<div class="document__commonUnderline"></div>
				<p class="document__commonText" align="right">${walls.textureA} - ${walls.textureB}</p>
			</div>

			${
				floorPanels.panels.length ? 
				`<div class="document__commonRow">
					<p class="document__commonText">Облицовка половых панелей</p>
					<div class="document__commonUnderline"></div>
					<p class="document__commonText" align="right">${floorPanels.texture ? floorPanels.texture : ''}</p>
				</div>`
				: ""
			}

		</div>
	`;

	const tableDetail = `
		<table class="document__tableDetail">

			<tr>
				<td class="document__tableDetailCell" align="center">№</td>
				<td class="document__tableDetailCell">Наименование товара</td>
				<td class="document__tableDetailCell">Индикатор</td>
				<td class="document__tableDetailCell" align="center">Толщина</td>
				<td class="document__tableDetailCell">Размер</td>
				<td class="document__tableDetailCell" align="center">Количество</td>
				<td class="document__tableDetailCell" align="center">S, м2</td>
			</tr>

			${(wallPanels.countWallPanels().outerPanels.map((panel, i) => `
				<tr>
					<td class="document__tableDetailCell" align="center">${i + 1}</td>
					<td class="document__tableDetailCell">Стеновая панель №${i + 1}</td>
					<td class="document__tableDetailCell">${panel.type}</td>
					<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
					<td class="document__tableDetailCell">${panel.width * 10} X ${walls.height * 10}</td>
					<td class="document__tableDetailCell" align="center">${panel.count}</td>
					<td class="document__tableDetailCell" align="center">${(panel.count * ((panel.width / 100) * (walls.height / 100))).toFixed(2)}</td>
				</tr>
			`)).join('')}

			${(wallPanels.countWallPanels().innerPanels.map((panel, i) => `
				<tr>
					<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + i + 1}</td>
					<td class="document__tableDetailCell">Панель перегородки №${i + 1}</td>
					<td class="document__tableDetailCell">${panel.type}</td>
					<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
					<td class="document__tableDetailCell">${panel.width * 10} X ${walls.height * 10}</td>
					<td class="document__tableDetailCell" align="center">${panel.count}</td>
					<td class="document__tableDetailCell" align="center">${(panel.count * ((panel.width / 100) * (walls.height / 100))).toFixed(2)}</td>
				</tr>
			`)).join('')}

			<tr>
				<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + wallPanels.numberOfTypesInner + 1}</td>
				<td class="document__tableDetailCell">Стойка</td>
				<td class="document__tableDetailCell"></td>
				<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
				<td class="document__tableDetailCell">${walls.height * 10}</td>
				<td class="document__tableDetailCell" align="center">4</td>
				<td class="document__tableDetailCell" align="center"></td>
			</tr>

			${(ceilingPanels.countCeilingPanels().map((panel, i) => `
				<tr>
					<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + wallPanels.numberOfTypesInner + 2 + i}</td>
					<td class="document__tableDetailCell">Потолочная панель №${i + 1}</td>
					<td class="document__tableDetailCell">${panel.type}</td>
					<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
					<td class="document__tableDetailCell">${panel.width * 10} X ${panel.height * 10}</td>
					<td class="document__tableDetailCell" align="center">${panel.count}</td>
					<td class="document__tableDetailCell" align="center">${(panel.count * ((panel.width / 100) * (panel.height / 100))).toFixed(2)}</td>
				</tr>
			`)).join('')}

			${(floorPanels.panels.map((panel, i) => `
				<tr>
					<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + wallPanels.numberOfTypesInner + ceilingPanels.numberOfTypes + 2 + i}</td>
					<td class="document__tableDetailCell">Половая панель №${i + 1}</td>
					<td class="document__tableDetailCell">${panel.type}</td>
					<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
					<td class="document__tableDetailCell">${panel.width * 10} X ${panel.height * 10}</td>
					<td class="document__tableDetailCell" align="center">${panel.count}</td>
					<td class="document__tableDetailCell" align="center">${(panel.count * ((panel.width / 100) * (panel.height / 100))).toFixed(2)}</td>
				</tr>
			`)).join('')}

			${(holes.getTableHolesArray().map((item, i, array) => {
				let previousNumbers = 0;
				for (let number = 0; number < i; number++) {
					if (array[number].count > 0) previousNumbers++;
				}
				if (item.count > 0 && previousNumbers) holes.tableNumbers = previousNumbers + 1;
				if (item.count > 0) return `
					<tr>
						<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + wallPanels.numberOfTypesInner + ceilingPanels.numberOfTypes + floorPanels.numberOfTypes + 2 + previousNumbers}</td>
						<td class="document__tableDetailCell">${item.name} №${previousNumbers + 1}${item.size === '900 X 1930' ? ' увелич. проем' : ''}</td>
						<td class="document__tableDetailCell">${item.indicator}</td>
						<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
						<td class="document__tableDetailCell">${item.type !== 'basedoor' ? item.size : ''}${item.direction}</td>
						<td class="document__tableDetailCell" align="center">${item.count}</td>
						<td class="document__tableDetailCell" align="center"></td>
					</tr>
				`;
			})).join('')}

			${(archPanels.panels.map((item, i) => `
					<tr>
						<td class="document__tableDetailCell" align="center">${wallPanels.numberOfTypesOuter + wallPanels.numberOfTypesInner + ceilingPanels.numberOfTypes + floorPanels.numberOfTypes + 2 + holes.tableNumbers + i}</td>
						<td class="document__tableDetailCell">${item.name} ${item.size}</td>
						<td class="document__tableDetailCell"></td>
						<td class="document__tableDetailCell" align="center">${walls.thickness * 10}</td>
						<td class="document__tableDetailCell">${item.size}</td>
						<td class="document__tableDetailCell" align="center">${item.count}</td>
						<td class="document__tableDetailCell" align="center"></td>
					</tr>
				`
			)).join('')}

		</table>
	`;

	const tableBottom = `
		<table class="document__tableBottom" rules="all">
			<tr>
				<td class="document__tableBottomCell">${additionalData ? additionalData.id : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.date : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.price : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.nds : ''}</td>
				<td class="document__tableBottomCell">${summary}</td>
				<td class="document__tableBottomCell">Лист</td>
			</tr>
			<tr>
				<td class="document__tableBottomCell">Заказ</td>
				<td class="document__tableBottomCell">Дата</td>
				<td class="document__tableBottomCell">Стоимость</td>
				<td class="document__tableBottomCell"></td>
				<td class="document__tableBottomCell"></td>
				<td class="document__tableBottomCell">1</td>
			</tr>
		</table>
	`;

	if (returnData === 'pdf') {
		return {
			data: `
				<div class="document">
					<svg class="document__title" width="86.6986mm" height="8.4666mm" fill-rule="evenodd" viewBox="0 0 8669.86 846.66">
						<polygon points="2118.66,22.1 2461.28,22.1 2461.28,736.2 2692.41,736.2 2692.41,827.06 2118.66,827.06" fill="#003154"/>
						<rect x="3828.04" y="22.1" width="343.29" height="804.96" fill="#003154"/>
						<path d="M1440.47 0c130.84,0 258.92,38.53 346.68,110.97 93.39,77.09 142.33,191.82 142.33,312.36 0,131.62 -58.24,256 -172.28,336.13 -79.2,55.64 -198.7,87.2 -316.73,87.2 -119.42,0 -232.82,-29.78 -317.74,-91.34 -107.11,-77.65 -169.94,-183.71 -171.26,-331.99 -1.1,-122.35 47.74,-239.54 145.26,-318.8 87.03,-70.75 215.01,-104.53 343.74,-104.53zm-34.04 65.51c-68.15,34.52 -88.32,123.37 -97.57,193.65 -18.8,142.78 9.71,424.67 137.37,505.9 10.48,6.67 21.4,12.65 32.24,18.69 55.91,-34.36 71.54,-65.01 88.5,-131.66 39.64,-155.77 9.7,-459.89 -122.65,-566.06 -14.1,-10.81 -25.99,-15.67 -37.89,-20.52z" fill="#003154"/>
						<path d="M-0 22.1l342.35 0c48.01,0 96.01,0 131.69,0 35.68,0 59.03,0 85.9,1.84 26.87,1.85 57.27,5.53 86.02,12.11 28.74,6.59 55.83,16.08 77.42,26.89 21.59,10.81 37.67,22.95 50.56,34.65 12.88,11.69 22.57,22.95 31.6,38.5 9.04,15.56 17.41,35.42 22.47,54.83 5.07,19.42 6.83,38.4 7.71,59.25 0.88,20.85 0.88,43.58 -1.21,67.3 -2.09,23.72 -6.28,48.43 -13.66,74.36 -7.38,25.93 -17.95,53.07 -31.61,76.79 -13.65,23.72 -30.39,44.02 -50.11,61.45 -19.71,17.44 -42.4,32 -68.39,43.92 -26,11.91 -55.29,21.18 -85.83,27.46 -30.53,6.29 -62.31,9.6 -96.12,10.48 -33.81,0.88 -69.66,-0.66 -94.41,-2.86 -24.74,-2.21 -38.39,-5.08 -52.03,-7.94l0 225.93 -342.35 0 0 -804.96zm342.35 64.35c10.68,-0.44 21.35,-0.88 32.64,0.11 11.29,1 23.18,3.42 35.85,8.28 12.66,4.85 26.1,12.14 38.66,23.06 12.55,10.92 24.23,25.48 32.71,40.93 8.48,15.45 13.76,31.77 18.06,49.87 4.29,18.09 7.6,37.95 8.37,61.31 0.78,23.36 -0.98,50.21 -3.25,72.78 -2.28,22.56 -5.08,40.83 -9.27,59.06 -4.19,18.24 -9.76,36.44 -16.52,54.15 -6.75,17.71 -14.68,34.92 -21.73,48.27 -7.05,13.35 -13.22,22.84 -19.39,32.33 -32.04,-2.65 -64.09,-5.3 -96.13,-7.95 0,-147.4 0,-294.8 0,-442.2z" fill="#003154"/>
						<path d="M4486.97 22.1l342.35 0 55.53 0 76.16 0c10.82,0 20.5,0 29.5,0.05l6.58 -0.01c142.66,-0.55 291.63,3.8 330.13,174.09 30.63,135.48 -20.39,281.49 -151.03,330.68l196.17 300.15 -369.4 0 -125.91 -277.33c-22.06,-1.93 -34.9,-4.36 -47.73,-6.78l0 58.18 0 88.13 0 137.8 -342.35 0 0 -804.96zm342.35 64.5l0 391.15c32.05,2.38 64.09,4.76 96.14,7.15 6.16,-8.54 12.33,-17.07 19.38,-29.08 7.05,-12.01 14.98,-27.49 21.73,-43.42 6.76,-15.93 12.34,-32.3 16.53,-48.71 4.19,-16.4 6.98,-32.83 9.26,-53.13 2.28,-20.29 4.03,-44.45 3.26,-65.46 -0.78,-21.01 -4.08,-38.88 -8.38,-55.15 -4.29,-16.28 -9.58,-24.35 -18.06,-38.24 -8.48,-13.89 -20.16,-26.99 -32.71,-36.82 -12.56,-9.82 -25.99,-16.38 -38.66,-20.74 -12.66,-4.37 -24.56,-6.55 -35.85,-7.44 -11.28,-0.89 -21.96,-0.5 -32.64,-0.11z" fill="#003154"/>
						<path d="M2969.73 22.1l456.86 0 179.08 804.96 -364.17 0 -47.27 -208.52 -261.49 0 -47.59 208.52 -99.13 0 183.71 -804.96zm205.44 512.37l-93.04 -410.42 -36.54 0 -93.67 410.42 223.25 0z" fill="#003154"/>
						<path d="M5601.12 22.1l342.35 0c48.01,0 96.01,0 131.69,0 35.68,0 59.03,0 85.9,1.84 26.88,1.85 57.27,5.53 86.02,12.11 28.75,6.59 55.84,16.08 77.42,26.89 21.59,10.81 37.67,22.95 50.56,34.65 12.88,11.69 22.57,22.95 31.6,38.5 9.04,15.56 17.41,35.42 22.47,54.83 5.07,19.42 6.83,38.4 7.71,59.25 0.88,20.85 0.88,43.58 -1.21,67.3 -2.09,23.72 -6.28,48.43 -13.66,74.36 -7.38,25.93 -17.95,53.07 -31.6,76.79 -13.66,23.72 -30.4,44.02 -50.12,61.45 -19.71,17.44 -42.4,32 -68.39,43.92 -25.99,11.91 -55.29,21.18 -85.83,27.46 -30.53,6.29 -62.31,9.6 -96.12,10.48 -33.81,0.88 -69.66,-0.66 -94.41,-2.86 -24.74,-2.21 -38.39,-5.08 -52.03,-7.94l0 225.93 -342.35 0 0 -804.96zm342.35 64.35c10.68,-0.44 21.35,-0.88 32.64,0.11 11.29,1 23.18,3.42 35.85,8.28 12.67,4.85 26.1,12.14 38.66,23.06 12.55,10.92 24.23,25.48 32.71,40.93 8.48,15.45 13.77,31.77 18.06,49.87 4.3,18.09 7.6,37.95 8.37,61.31 0.78,23.36 -0.98,50.21 -3.25,72.78 -2.28,22.56 -5.07,40.83 -9.26,59.06 -4.19,18.24 -9.77,36.44 -16.53,54.15 -6.75,17.71 -14.68,34.92 -21.73,48.27 -7.05,13.35 -13.22,22.84 -19.38,32.33 -32.05,-2.65 -64.1,-5.3 -96.14,-7.95 0,-147.4 0,-294.8 0,-442.2z" fill="#F44336"/>
						<path d="M6654.47 22.1l342.35 0 55.52 0 76.17 0c10.82,0 20.5,0 29.49,0.05l6.58 -0.01c142.66,-0.55 291.64,3.8 330.13,174.09 30.63,135.48 -20.38,281.49 -151.03,330.68l196.17 300.15 -369.4 0 -125.91 -277.33c-22.06,-1.93 -34.89,-4.36 -47.72,-6.78l0 58.18 0 88.13 0 137.8 -342.35 0 0 -804.96zm342.35 64.5l0 391.15c32.04,2.38 64.09,4.76 96.13,7.15 6.17,-8.54 12.33,-17.07 19.38,-29.08 7.05,-12.01 14.98,-27.49 21.74,-43.42 6.75,-15.93 12.33,-32.3 16.52,-48.71 4.19,-16.4 6.99,-32.83 9.26,-53.13 2.28,-20.29 4.04,-44.45 3.26,-65.46 -0.77,-21.01 -4.08,-38.88 -8.37,-55.15 -4.3,-16.28 -9.59,-24.35 -18.07,-38.24 -8.48,-13.89 -20.15,-26.99 -32.71,-36.82 -12.55,-9.82 -25.99,-16.38 -38.65,-20.74 -12.67,-4.37 -24.57,-6.55 -35.85,-7.44 -11.29,-0.89 -21.97,-0.5 -32.64,-0.11z" fill="#F44336"/>
						<path d="M8180.85 0c130.83,0 258.92,38.53 346.67,110.97 93.39,77.09 142.34,191.82 142.34,312.36 0,131.62 -58.24,256 -172.29,336.13 -79.19,55.64 -198.69,87.2 -316.72,87.2 -119.43,0 -232.82,-29.78 -317.74,-91.34 -107.11,-77.65 -169.95,-183.71 -171.27,-331.99 -1.09,-122.35 47.75,-239.54 145.27,-318.8 87.03,-70.75 215.01,-104.53 343.74,-104.53zm-34.04 65.51c-68.15,34.52 -88.32,123.37 -97.57,193.65 -18.8,142.78 9.7,424.67 137.37,505.9 10.47,6.67 21.39,12.65 32.23,18.69 55.91,-34.36 71.55,-65.01 88.5,-131.66 39.64,-155.77 9.71,-459.89 -122.64,-566.06 -14.1,-10.81 -25.99,-15.67 -37.89,-20.52z" fill="#F44336"/>
					</svg>
					<div class="document__body">
						${tableLeft}
						<div class="document__main">
							<div class="document__content">
								<img class="document__svgContainer" alt="" src="${svgURI}">
								<div class="document__tables">
									<div class="document__tableContainer">
										<p class="document__tableCommonHeader">Параметры камеры</p>
										${tableCommon}
									</div>
									<div class="document__tableContainer">
										<p class="document__tableDetailHeader">Состав камеры</p>
										${tableDetail}
									</div>
								</div>
							</div>
							${tableBottom}
						</div>
					</div>
				</div>
			`
		}
	}
	else return {
		scheme: svg,
		table: `
			<div class="container">
				${summary}
				${tableDetail}
			</div>
		`
	}

}