USE autopart_pro;
INSERT INTO categories(name) VALUES('Frenos'),('Filtros'),('Suspension'),('Encendido'),('Electrico'),('Iluminacion');
INSERT INTO vehicles(make,model,year_from,year_to) VALUES('Toyota','Corolla',2018,2024),('Mazda','3',2015,2023),('Renault','Duster',2016,2024),('Chevrolet','Onix',2020,2025),('Kia','Sportage',2017,2023),('Hyundai','Tucson',2016,2022);
INSERT INTO products(category_id,sku,name,brand,price,stock,minimum_stock) VALUES
(1,'BR-2041','Pastillas freno ceramicas','Brembo',189900,24,8),
(2,'FL-1088','Filtro aceite premium','Bosch',45900,4,10),
(3,'AM-3072','Amortiguador delantero','Monroe',325000,16,6),
(4,'BU-4026','Bujia iridio IX','NGK',38900,3,12),
(5,'BA-1015','Bateria 12V 60Ah','Willard',489000,11,5),
(6,'LL-2103','Bombillo LED H7','Philips',128000,32,10);
INSERT INTO product_vehicles(product_id,vehicle_id) VALUES(1,1),(2,2),(3,3),(4,4),(5,5),(6,6);
