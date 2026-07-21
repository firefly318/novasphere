-- ============================================================================
-- SYSTEM: HOTEL MATERIAL MANAGEMENT SYSTEM
-- DATABASE SCRIPT FOR SQL SERVER 2014
-- AUTHOR: GEMINI AI COLLABORATOR
-- ============================================================================

CREATE DATABASE HotelMaterialDB;
GO
USE HotelMaterialDB;
GO

-- ============================================================================
-- 1. KHỞI TẠO ĐỊNH DẠNG CÁC BẢNG DỮ LIỆU (TABLES)
-- ============================================================================

-- Bảng Roles (Phân quyền)
CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- Bảng Users (Người dùng)
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    Permissions INT NOT NULL DEFAULT 7,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);

-- Bảng Categories (Loại vật tư)
CREATE TABLE Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    IsDeleted BIT DEFAULT 0
);

-- Bảng Materials (Danh mục vật tư)
CREATE TABLE Materials (
    MaterialId INT IDENTITY(1,1) PRIMARY KEY,
    MaterialCode VARCHAR(50) NOT NULL UNIQUE,
    MaterialName NVARCHAR(150) NOT NULL,
    Unit NVARCHAR(30) NOT NULL,
    StockQuantity INT DEFAULT 0,
    MinRequiredQuantity INT DEFAULT 0,
    CategoryId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CONSTRAINT FK_Materials_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId),
    CONSTRAINT CHK_Materials_Stock CHECK (StockQuantity >= 0),
    CONSTRAINT CHK_Materials_MinQty CHECK (MinRequiredQuantity >= 0)
);

-- Bảng Suppliers (Nhà cung cấp)
CREATE TABLE Suppliers (
    SupplierId INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName NVARCHAR(150) NOT NULL,
    Phone VARCHAR(20),
    Address NVARCHAR(255)
);

-- Bảng Departments (Bộ phận sử dụng/nhận vật tư)
CREATE TABLE Departments (
    DepartmentId INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL UNIQUE
);

-- Bảng GoodsReceiptNotes (Phiếu nhập kho)
CREATE TABLE GoodsReceiptNotes (
    GRN_Id INT IDENTITY(1,1) PRIMARY KEY,
    GRN_Code VARCHAR(50) NOT NULL UNIQUE,
    SupplierId INT NOT NULL,
    UserId INT NOT NULL,
    ReceivedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_GRN_Suppliers FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId),
    CONSTRAINT FK_GRN_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Bảng GRN_Details (Chi tiết phiếu nhập kho)
CREATE TABLE GRN_Details (
    GRN_DetailId INT IDENTITY(1,1) PRIMARY KEY,
    GRN_Id INT NOT NULL,
    MaterialId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_GRNDetails_GRN FOREIGN KEY (GRN_Id) REFERENCES GoodsReceiptNotes(GRN_Id),
    CONSTRAINT FK_GRNDetails_Materials FOREIGN KEY (MaterialId) REFERENCES Materials(MaterialId),
    CONSTRAINT CHK_GRNDetails_Qty CHECK (Quantity > 0),
    CONSTRAINT CHK_GRNDetails_Price CHECK (UnitPrice >= 0)
);

-- Bảng GoodsDeliveryNotes (Phiếu xuất kho)
CREATE TABLE GoodsDeliveryNotes (
    GDN_Id INT IDENTITY(1,1) PRIMARY KEY,
    GDN_Code VARCHAR(50) NOT NULL UNIQUE,
    DepartmentId INT NOT NULL,
    UserId INT NOT NULL,
    DeliveryDate DATETIME DEFAULT GETDATE(),
    Reason NVARCHAR(255),
    CONSTRAINT FK_GDN_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId),
    CONSTRAINT FK_GDN_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Bảng GDN_Details (Chi tiết phiếu xuất kho)
CREATE TABLE GDN_Details (
    GDN_DetailId INT IDENTITY(1,1) PRIMARY KEY,
    GDN_Id INT NOT NULL,
    MaterialId INT NOT NULL,
    Quantity INT NOT NULL,
    CONSTRAINT FK_GDNDetails_GDN FOREIGN KEY (GDN_Id) REFERENCES GoodsDeliveryNotes(GDN_Id),
    CONSTRAINT FK_GDNDetails_Materials FOREIGN KEY (MaterialId) REFERENCES Materials(MaterialId),
    CONSTRAINT CHK_GDNDetails_Qty CHECK (Quantity > 0)
);

-- Bảng StocktakeNotes (Phiếu kiểm kê)
CREATE TABLE StocktakeNotes (
    StocktakeId INT IDENTITY(1,1) PRIMARY KEY,
    StocktakeCode VARCHAR(50) NOT NULL UNIQUE,
    UserId INT NOT NULL,
    StocktakeDate DATETIME DEFAULT GETDATE(),
    Notes NVARCHAR(255),
    CONSTRAINT FK_Stocktake_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Bảng Stocktake_Details (Chi tiết phiếu kiểm kê)
CREATE TABLE Stocktake_Details (
    StocktakeDetailId INT IDENTITY(1,1) PRIMARY KEY,
    StocktakeId INT NOT NULL,
    MaterialId INT NOT NULL,
    SystemQuantity INT NOT NULL,
    ActualQuantity INT NOT NULL,
    Discrepancy INT NOT NULL,
    CONSTRAINT FK_StocktakeDetails_Notes FOREIGN KEY (StocktakeId) REFERENCES StocktakeNotes(StocktakeId),
    CONSTRAINT FK_StocktakeDetails_Materials FOREIGN KEY (MaterialId) REFERENCES Materials(MaterialId)
);

-- Bảng System_Alerts (Cảnh báo hệ thống thông minh)
CREATE TABLE System_Alerts (
    AlertId INT IDENTITY(1,1) PRIMARY KEY,
    MaterialId INT NOT NULL,
    AlertType NVARCHAR(50) NOT NULL, -- 'LOW_STOCK' hoặc 'STAGNANT'
    AlertMessage NVARCHAR(255) NOT NULL,
    IsResolved BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Alerts_Materials FOREIGN KEY (MaterialId) REFERENCES Materials(MaterialId)
);
GO

-- ============================================================================
-- 2. KHAI BÁO DỮ LIỆU BAN ĐẦU (DỮ LIỆU DANH MỤC CƠ BẢN)
-- ============================================================================

-- Khởi tạo Quyền hạn
INSERT INTO Roles (RoleName) VALUES (N'Quản trị viên'), (N'Nhân viên kho');

-- Khởi tạo Người dùng mẫu (Mật khẩu text mẫu: 'admin123', 'staff123' - trên thực tế sẽ lưu chuỗi bcrypt hash)
INSERT INTO Users (Username, PasswordHash, FullName, RoleId) VALUES 
('admin', '$2b$10$eFmXW23u.S9BvjM0l.9MpeL18YlC8kG1Hh3v4vXG9Xb5zM2Yw/S2q', N'Nguyễn Minh Phúc', 1),
('staff_kho', '$2b$10$eFmXW23u.S9BvjM0l.9MpeL18YlC8kG1Hh3v4vXG9Xb5zM2Yw/S2q', N'Trần Thị Ngọt', 2);

-- Khởi tạo Loại vật tư khách sạn
INSERT INTO Categories (CategoryName) VALUES 
(N'Đồ tiêu hao (Amenities)'), 
(N'Thiết bị điện tử'), 
(N'Vải vóc (Linen)'),
(N'Hóa chất tẩy rửa');

-- Khởi tạo Vật tư ban đầu
INSERT INTO Materials (MaterialCode, MaterialName, Unit, MinRequiredQuantity, CategoryId) VALUES
('AME-SOAP', N'Xà bông cục nhỏ', N'Cục', 500, 1),
('AME-SHAM', N'Dầu gội chai nhỏ', N'Chai', 500, 1),
('LIN-TOWEL', N'Khăn tắm trắng 60x120', N'Cái', 100, 3),
('LIN-SHEET', N'Chăn ga giường King', N'Cái', 50, 3),
('ELE-BULB', N'Bóng đèn LED 9W', N'Cái', 20, 2),
('CHEM-CHLO', N'Dung dịch tẩy rửa Chlorine', N'Can 5L', 10, 4);

-- Khởi tạo Nhà cung cấp
INSERT INTO Suppliers (SupplierName, Phone, Address) VALUES 
(N'Công ty TNHH Thiết bị Khách sạn Thuận Phát', '0283999888', N'123 Nguyễn Trãi, Q.5, TP.HCM'),
(N'Tổng kho Tổng hợp Đồng Nai', '02513888999', N'Đường Đồng Khởi, Biên Hòa, Đồng Nai');

-- Khởi tạo Bộ phận khách sạn
INSERT INTO Departments (DepartmentName) VALUES 
(N'Bộ phận Buồng phòng (Housekeeping)'), 
(N'Bộ phận Nhà hàng (F&B)'), 
(N'Bộ phận Kỹ thuật (Engineering)'),
(N'Bộ phận Lễ tân (Front Office)');
GO

-- ============================================================================
-- 3. ĐỊNH NẠNG CẤU TRÚC BẢNG (TABLE-VALUED PARAMETERS - TVP)
-- Tối ưu hóa việc truyền danh sách mảng dữ liệu từ API Backend vào SQL Server
-- ============================================================================

CREATE TYPE Type_GRN_Detail_List AS TABLE (
    MaterialId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL
);
GO

CREATE TYPE Type_GDN_Detail_List AS TABLE (
    MaterialId INT NOT NULL,
    Quantity INT NOT NULL
);
GO

-- ============================================================================
-- 4. XÂY DỰNG CÁC STORED PROCEDURES (SP) NGHIỆP VỤ
-- ============================================================================

-- MODULE 1: AUTH MODULE PROCEDURES // ĐĂNG NHẬP VÀ XỬ LÝ PHÂN QUYỀN
CREATE PROCEDURE sp_User_Login
    @Username VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserId, Username, PasswordHash, FullName, RoleId, IsActive, Permissions 
    FROM Users 
    WHERE Username = @Username AND IsActive = 1;
END;
GO

CREATE PROCEDURE sp_User_ChangePassword
    @UserId INT,
    @NewPasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET PasswordHash = @NewPasswordHash 
    WHERE UserId = @UserId;
END;
GO

CREATE PROCEDURE sp_User_ResetPassword
    @TargetUserId INT,
    @NewPasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET PasswordHash = @NewPasswordHash 
    WHERE UserId = @TargetUserId;
END;
GO

CREATE PROCEDURE sp_User_GetList
AS
BEGIN
    SET NOCOUNT ON;
    SELECT U.UserId, U.Username, U.FullName, U.RoleId, R.RoleName, U.IsActive, U.Permissions, U.CreatedAt
    FROM Users U
    INNER JOIN Roles R ON U.RoleId = R.RoleId;
END;
GO

CREATE PROCEDURE sp_User_UpdateRole
    @UserId INT,
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users SET RoleId = @RoleId WHERE UserId = @UserId;
END;
GO

-- MODULE 2: CATEGORIES MODULE PROCEDURES // QUẢN LÝ LOẠI VẬT TƯ
CREATE PROCEDURE sp_Category_Insert
    @CategoryName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Categories WHERE CategoryName = @CategoryName AND IsDeleted = 0)
    BEGIN
        RAISERROR('5001', 16, 1); -- Tên loại vật tư đã tồn tại
        RETURN;
    END;
    
    INSERT INTO Categories (CategoryName) VALUES (@CategoryName);
    SELECT SCOPE_IDENTITY() AS NewCategoryId;
END;
GO

CREATE PROCEDURE sp_Category_Update
    @CategoryId INT,
    @CategoryName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Categories SET CategoryName = @CategoryName WHERE CategoryId = @CategoryId;
END;
GO

CREATE PROCEDURE sp_Category_Delete
    @CategoryId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Materials WHERE CategoryId = @CategoryId AND IsActive = 1)
    BEGIN
        RAISERROR('Không thể xóa loại vật tư này do đang ràng buộc dữ liệu danh mục hàng hóa.', 16, 1);
        RETURN;
    END;
    
    UPDATE Categories SET IsDeleted = 1 WHERE CategoryId = @CategoryId;
END;
GO

CREATE PROCEDURE sp_Category_Search
    @Keyword NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CategoryId, CategoryName 
    FROM Categories 
    WHERE LOWER(CategoryName) LIKE N'%' + LOWER(@Keyword) + '%' AND IsDeleted = 0
END;
GO

-- MODULE 3: MATERIALS MODULE PROCEDURES // QUẢN LÝ VẬT TƯ
CREATE PROCEDURE sp_Material_Insert
    @MaterialCode VARCHAR(50),
    @MaterialName NVARCHAR(150),
    @Unit NVARCHAR(30),
    @MinRequiredQuantity INT,
    @CategoryId INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Materials (MaterialCode, MaterialName, Unit, StockQuantity, MinRequiredQuantity, CategoryId)
    VALUES (@MaterialCode, @MaterialName, @Unit, 0, @MinRequiredQuantity, @CategoryId);
END;
GO

CREATE PROCEDURE sp_Material_Update
    @MaterialId INT,
    @MaterialName NVARCHAR(150),
    @Unit NVARCHAR(30),
    @MinRequiredQuantity INT,
    @CategoryId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Materials 
    SET MaterialName = @MaterialName, Unit = @Unit, MinRequiredQuantity = @MinRequiredQuantity, CategoryId = @CategoryId
    WHERE MaterialId = @MaterialId;
END;
GO

CREATE PROCEDURE sp_Material_Delete
    @MaterialId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM GRN_Details WHERE MaterialId = @MaterialId) OR EXISTS (SELECT 1 FROM GDN_Details WHERE MaterialId = @MaterialId)
    BEGIN
        -- Đã có lịch sử nhập xuất, chuyển trạng thái IsActive = 0
        UPDATE Materials SET IsActive = 0 WHERE MaterialId = @MaterialId;
    END;
    ELSE
    BEGIN
        -- Chưa từng phát sinh chứng từ, thực hiện xóa vật lý
        DELETE FROM Materials WHERE MaterialId = @MaterialId;
    END;
END;
GO

CREATE PROCEDURE sp_Material_GetList
    @CategoryId INT = NULL,
    @IsActive BIT = NULL,
    @Keyword NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT M.MaterialId, M.MaterialCode, M.MaterialName, M.Unit, M.StockQuantity, M.MinRequiredQuantity, M.CategoryId, C.CategoryName, M.IsActive
    FROM Materials M
    INNER JOIN Categories C ON M.CategoryId = C.CategoryId
    WHERE (@CategoryId IS NULL OR M.CategoryId = @CategoryId)
      AND (@IsActive IS NULL OR M.IsActive = @IsActive)
      AND (@Keyword IS NULL OR LOWER(M.MaterialName) LIKE N'%' + LOWER(@Keyword) + '%' OR LOWER(M.MaterialCode) LIKE '%' + LOWER(@Keyword) + '%')
    ORDER BY M.MaterialCode
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE PROCEDURE sp_Material_GetStockBalance
    @MaterialId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaterialId, MaterialCode, MaterialName, StockQuantity, Unit
    FROM Materials
    WHERE (@MaterialId IS NULL OR MaterialId = @MaterialId) AND IsActive = 1;
END;
GO

-- MODULE 4: INVENTORY-GRN MODULE PROCEDURES (LẬP PHIẾU NHẬP KHO)
CREATE PROCEDURE sp_GRN_Create
    @GRN_Code VARCHAR(50),
    @SupplierId INT,
    @UserId INT,
    @Details Type_GRN_Detail_List READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Khởi tạo Master Phiếu nhập
        INSERT INTO GoodsReceiptNotes (GRN_Code, SupplierId, UserId, ReceivedDate)
        VALUES (@GRN_Code, @SupplierId, @UserId, GETDATE());

        DECLARE @GRN_Id INT = SCOPE_IDENTITY();

        -- Đổ danh sách mảng TVP vào bảng chi tiết
        INSERT INTO GRN_Details (GRN_Id, MaterialId, Quantity, UnitPrice)
        SELECT @GRN_Id, MaterialId, Quantity, UnitPrice FROM @Details;

        -- Vòng lặp cập nhật cộng dồn tồn kho trong bảng Vật Tư
        UPDATE M
        SET M.StockQuantity = M.StockQuantity + D.Quantity
        FROM Materials M
        INNER JOIN @Details D ON M.MaterialId = D.MaterialId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH;
END;
GO

CREATE PROCEDURE sp_GRN_GetDetail
    @GRN_Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        G.GRN_Id, G.GRN_Code, G.ReceivedDate,
        S.SupplierName, U.FullName AS StaffName,
        D.MaterialId, M.MaterialCode, M.MaterialName, M.Unit,
        D.Quantity, D.UnitPrice, (D.Quantity * D.UnitPrice) AS TotalPrice
    FROM GoodsReceiptNotes G
    INNER JOIN Suppliers S ON G.SupplierId = S.SupplierId
    INNER JOIN Users U ON G.UserId = U.UserId
    INNER JOIN GRN_Details D ON G.GRN_Id = D.GRN_Id
    INNER JOIN Materials M ON D.MaterialId = M.MaterialId
    WHERE G.GRN_Id = @GRN_Id;
END;
GO

-- MODULE 5: INVENTORY-GDN MODULE PROCEDURES (LẬP PHIẾU XUẤT KHO)
CREATE PROCEDURE sp_GDN_Create
    @GDN_Code VARCHAR(50),
    @DepartmentId INT,
    @UserId INT,
    @Reason NVARCHAR(255),
    @Details Type_GDN_Detail_List READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Bước 2: Kiểm tra điều kiện tồn kho thực tế trước khi xuất hàng
        IF EXISTS (
            SELECT 1 
            FROM @Details D
            INNER JOIN Materials M ON D.MaterialId = M.MaterialId
            WHERE M.StockQuantity < D.Quantity
        )
        BEGIN
            RAISERROR('Không đủ số lượng hàng tồn kho phục vụ cho yêu cầu xuất!', 16, 1);
            RETURN;
        END;

        -- Tạo Master Phiếu xuất kho
        INSERT INTO GoodsDeliveryNotes (GDN_Code, DepartmentId, UserId, DeliveryDate, Reason)
        VALUES (@GDN_Code, @DepartmentId, @UserId, GETDATE(), @Reason);

        DECLARE @GDN_Id INT = SCOPE_IDENTITY();

        -- Thêm vào cấu trúc chi tiết phiếu xuất
        INSERT INTO GDN_Details (GDN_Id, MaterialId, Quantity)
        SELECT @GDN_Id, MaterialId, Quantity FROM @Details;

        -- Tự động trừ số lượng tồn trong danh mục bảng hàng hóa
        UPDATE M
        SET M.StockQuantity = M.StockQuantity - D.Quantity
        FROM Materials M
        INNER JOIN @Details D ON M.MaterialId = D.MaterialId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH;
END;
GO

CREATE PROCEDURE sp_GDN_GetDetail
    @GDN_Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        G.GDN_Id, G.GDN_Code, G.DeliveryDate, G.Reason,
        DP.DepartmentName, U.FullName AS StaffName,
        D.MaterialId, M.MaterialCode, M.MaterialName, M.Unit, D.Quantity
    FROM GoodsDeliveryNotes G
    INNER JOIN Departments DP ON G.DepartmentId = DP.DepartmentId
    INNER JOIN Users U ON G.UserId = U.UserId
    INNER JOIN GDN_Details D ON G.GDN_Id = D.GDN_Id
    INNER JOIN Materials M ON D.MaterialId = M.MaterialId
    WHERE G.GDN_Id = @GDN_Id;
END;
GO

-- MODULE 6: STOCKTAKE MODULE PROCEDURES (KIỂM KÊ)
CREATE PROCEDURE sp_Stock_GetInventoryReport
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaterialId, MaterialCode, MaterialName, Unit, StockQuantity 
    FROM Materials 
    WHERE IsActive = 1;
END;
GO

CREATE PROCEDURE sp_Stocktake_Create
    @Stocktake_Code VARCHAR(50),
    @UserId INT,
    @Notes NVARCHAR(255),
    @MaterialId INT,
    @ActualQuantity INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SystemQuantity INT;
        SELECT @SystemQuantity = StockQuantity FROM Materials WHERE MaterialId = @MaterialId;

        DECLARE @Discrepancy INT = @ActualQuantity - @SystemQuantity;

        -- Tạo phiếu kiểm kê
        INSERT INTO StocktakeNotes (StocktakeCode, UserId, StocktakeDate, Notes)
        VALUES (@Stocktake_Code, @UserId, GETDATE(), @Notes);

        DECLARE @StocktakeId INT = SCOPE_IDENTITY();

        -- Ghi log chi tiết chênh lệch dữ liệu đếm thực tế
        INSERT INTO Stocktake_Details(StocktakeId, MaterialId, SystemQuantity, ActualQuantity, Discrepancy)
        VALUES (@StocktakeId, @MaterialId, @SystemQuantity, @ActualQuantity, @Discrepancy);

        -- Cân bằng đồng bộ lại số lượng tồn kho theo số liệu thực tế ngoài kho
        UPDATE Materials 
        SET StockQuantity = @ActualQuantity 
        WHERE MaterialId = @MaterialId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH;
END;
GO

-- MODULE 7: AI-ANALYTICS MODULE PROCEDURES (THỐNG KÊ & CẢNH BÁO THÔNG MINH)
CREATE PROCEDURE sp_Report_GetTraffic
    @FromDate DATETIME,
    @ToDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thống kê tổng số lượng nhập/xuất theo chuỗi thời gian ngày
    SELECT 
        ISNULL(InLog.LogDate, OutLog.LogDate) AS TrafficDate,
        ISNULL(InLog.TotalImport, 0) AS TotalImport,
        ISNULL(OutLog.TotalExport, 0) AS TotalExport
    FROM (
        SELECT CAST(G.ReceivedDate AS DATE) AS LogDate, SUM(D.Quantity) AS TotalImport
        FROM GoodsReceiptNotes G
        INNER JOIN GRN_Details D ON G.GRN_Id = D.GRN_Id
        WHERE G.ReceivedDate BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(G.ReceivedDate AS DATE)
    ) InLog
    FULL OUTER JOIN (
        SELECT CAST(G.DeliveryDate AS DATE) AS LogDate, SUM(D.Quantity) AS TotalExport
        FROM GoodsDeliveryNotes G
        INNER JOIN GDN_Details D ON G.GDN_Id = D.GDN_Id
        WHERE G.DeliveryDate BETWEEN @FromDate AND @ToDate
        GROUP BY CAST(G.DeliveryDate AS DATE)
    ) OutLog ON InLog.LogDate = OutLog.LogDate
    ORDER BY TrafficDate
END;
GO

CREATE PROCEDURE sp_Report_GetTopMovingMaterials
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 10 
        M.MaterialId,
        M.MaterialCode,
        M.MaterialName,
        SUM(D.Quantity) AS TotalConsumed
    FROM GDN_Details D
    INNER JOIN Materials M ON D.MaterialId = M.MaterialId
    GROUP BY M.MaterialId, M.MaterialCode, M.MaterialName
    ORDER BY TotalConsumed DESC;
END;
GO

CREATE PROCEDURE sp_AI_DetectLowStock
AS
BEGIN
    SET NOCOUNT ON;

    -- Quét toàn bộ hệ thống phát hiện vật tư chạm hoặc dưới hạn mức tồn tối thiểu nguy hiểm
    INSERT INTO System_Alerts (MaterialId, AlertType, AlertMessage)
    SELECT 
        MaterialId, 
        'LOW_STOCK', 
        N'Vật tư [' + MaterialCode + '] ' + MaterialName + N' sắp hết! Hiện tại chỉ còn ' + CAST(StockQuantity AS NVARCHAR(10)) + ' ' + Unit + N' (Hạn mức tối thiểu: ' + CAST(MinRequiredQuantity AS NVARCHAR(10)) + ')'
    FROM Materials
    WHERE StockQuantity <= MinRequiredQuantity 
      AND IsActive = 1
      AND MaterialId NOT IN (SELECT MaterialId FROM System_Alerts WHERE IsResolved = 0 AND AlertType = 'LOW_STOCK');

    -- Trả danh sách cảnh báo chưa xử lý phục vụ Websocket Backend đẩy thông báo Real-time lên Dashboard
    SELECT A.AlertId, A.MaterialId, M.MaterialCode, A.AlertMessage, A.CreatedAt
    FROM System_Alerts A
    INNER JOIN Materials M ON A.MaterialId = M.MaterialId
    WHERE A.IsResolved = 0 AND A.AlertType = 'LOW_STOCK';
END;
GO

CREATE PROCEDURE sp_AI_GetStagnantMaterials
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Kiểm tra vật tư không phát sinh hoặc rất ít phát sinh xuất kho (GDN_Details) trong vòng 90 ngày
    SELECT 
        M.MaterialId,
        M.MaterialCode,
        M.MaterialName,
        M.StockQuantity,
        M.Unit,
        ISNULL(SumOut.Qty, 0) AS TotalExportedLast90Days
    FROM Materials M
    LEFT JOIN (
        SELECT D.MaterialId, SUM(D.Quantity) AS Qty
        FROM GDN_Details D
        INNER JOIN GoodsDeliveryNotes G ON D.GDN_Id = G.GDN_Id
        WHERE G.DeliveryDate >= DATEADD(DAY, -90, GETDATE())
        GROUP BY D.MaterialId
    ) SumOut ON M.MaterialId = SumOut.MaterialId
    WHERE M.IsActive = 1 
      AND M.StockQuantity > 0 -- Có giữ lượng hàng tồn trong kho
      AND ISNULL(SumOut.Qty, 0) <= (M.StockQuantity * 0.05) -- Lượng tiêu thụ 90 ngày nhỏ hơn hoặc bằng 5% lượng tồn đọng hiện tại
    ORDER BY M.StockQuantity DESC;
END;
GO