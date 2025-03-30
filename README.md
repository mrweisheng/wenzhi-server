# 文字系统后端服务

## 项目简介
本项目是文字系统的后端服务，提供写手管理、用户认证、写手评分等功能的API接口。

## 技术栈
- Node.js + Express
- TypeScript
- MySQL
- JWT认证

## 主要功能模块

### 1. 用户认证模块
- 用户登录
- 获取用户信息
- 修改用户邮箱
- 修改用户密码

### 2. 写手管理模块
- 获取写手列表与详情
- 创建/更新/删除写手信息
- 批量删除写手
- 写手信息激活状态判断

### 3. 写手评分系统
- 质检员对写手进行评分与评价
- 查询写手评分历史
- 获取写手当天评分记录
- 获取写手特定日期评分记录
- 查询某日所有写手评分情况
- 获取未评分的写手列表

### 4. 案例管理模块
- 获取案例列表与详情
- 创建案例（支持多图片上传）
- 删除案例
- 按类型筛选案例

### 写手评分系统实现细节

1. 数据库设计：
   - 创建`writer_ratings`表，包含以下字段：
     - `id`: 记录ID
     - `writer_id`: 写手ID，关联`writer_info`表
     - `score`: 评分(1-10分)，支持小数点后一位
     - `comment`: 评价内容(必填)
     - `quality_inspector_id`: 质检员ID，关联`users`表
     - `rating_date`: 评分日期
     - `created_at`: 创建时间
     - `updated_at`: 更新时间
   - 创建唯一索引`idx_writer_date`确保每个写手每天只有一条评分记录

2. 权限控制：
   - 添加`checkRatingPermission`中间件，确保只有质检员角色才能执行评分操作
   - 使用`auth`中间件保护所有API接口，确保用户登录状态

3. API实现：
   - `/api/writers/:writerId/ratings` (POST): 添加或更新写手评分
   - `/api/writers/:writerId/ratings` (GET): 获取写手评分历史
   - `/api/writers/:writerId/today-rating` (GET): 获取写手当天评分记录
   - `/api/writers/:writerId/rating-by-date` (GET): 获取写手特定日期评分记录
   - `/api/writer-ratings/daily` (GET): 获取某日所有写手评分
   - `/api/writer-ratings/unrated` (GET): 获取未评分的写手列表

4. 主要业务逻辑：
   - 添加评分时检查写手是否存在
   - 验证评分范围(1-10分)
   - 确保评价内容必填
   - 检查同一天是否已有评分记录，有则更新，无则创建
   - 支持按日期范围查询评分历史
   - 支持分页显示评分结果

5. 响应数据格式：
   - 所有接口返回统一的数据格式，包含状态码、消息和数据
   - 评分数据包含写手信息、质检员信息、评分、评价等详细内容

### 案例管理系统实现细节

1. 数据库设计：
   - 创建`cases`表，包含以下字段：
     - `id`: 案例ID，格式为"CASE-XXX"
     - `case_type`: 案例类型，如"聊天话术"、"营销文案"等
     - `title`: 案例标题
     - `content`: 案例内容
     - `images`: 图片URL地址，以JSON格式存储
     - `creator_id`: 创建人ID，关联`users`表
     - `created_at`: 创建时间
     - `updated_at`: 更新时间

2. 图片上传功能：
   - 使用`multer`中间件处理文件上传
   - 创建`upload`目录按年月存储图片文件
   - 生成唯一文件名，避免文件名冲突
   - 支持多图片上传（最多10张）
   - 图片大小限制为2MB
   - 仅支持常见图片格式(jpg, jpeg, png, gif)

3. 权限控制：
   - 添加`checkRolePermission`中间件，确保只有超级管理员、主管、客服及质检人员可以访问案例管理功能
   - 使用`auth`中间件保护所有API接口，确保用户登录状态

4. API实现：
   - `/api/cases` (GET): 获取案例列表，支持分页和按类型筛选
   - `/api/cases/:id` (GET): 获取案例详情
   - `/api/cases` (POST): 创建案例，支持多图片上传
   - `/api/cases/:id` (DELETE): 删除案例及其关联的图片文件

5. 主要业务逻辑：
   - 案例ID自动生成，格式为"CASE-XXX"
   - 图片文件存储在服务器本地目录，路径结构为`upload/YYYYMM/timestamp_随机数.扩展名`
   - 图片URL生成规则确保可通过HTTP直接访问
   - 删除案例时同步删除关联的图片文件
   - 支持按案例类型筛选列表结果
   - 支持分页显示案例列表

6. 响应数据格式：
   - 所有接口返回统一的数据格式，包含状态码、消息和数据
   - 案例数据包含创建人信息、案例详情、图片URL等完整内容

## API接口文档
详细的API接口说明请参考项目中的`api-docs.txt`文件，包含了所有接口的请求方法、参数说明和响应格式。

## 数据库结构
主要数据表：
- `users`: 用户表，包含用户名、密码、角色等信息
- `writer_info`: 写手信息表，包含写手基本信息
- `writer_ratings`: 写手评分表，记录质检员对写手的评分与评价
- `cases`: 案例表，存储案例信息，包括类型、标题、内容和关联图片

## 权限控制
系统实现了基于角色的访问控制：
- 普通用户：可以查看写手信息
- 质检员：可以对写手进行评分与评价
- 管理员：可以管理写手信息和用户信息

## 开发与部署
### 安装依赖
```
npm install
```

### 开发环境运行
```
npm run dev
```

### 生产环境构建
```
npm run build
```

### 生产环境运行
```
npm start
```

## 日志系统

系统使用Winston日志库实现了完整的日志记录功能：

1. **日志位置**: 所有日志文件存储在 `/var/log/wenzhi-server/` 目录下
2. **日志文件**:
   - 应用日志: `wenzhi-server-YYYY-MM-DD.log`
   - 错误日志: `wenzhi-server-error-YYYY-MM-DD.log`
   - 最新日志链接: `/var/log/wenzhi-server.log` (指向当天日志文件的符号链接)

3. **日志级别**:
   - 生产环境: INFO及以上级别
   - 开发环境: DEBUG及以上级别

4. **日志内容**:
   - HTTP请求日志 (访问路径、状态码、响应时间)
   - 错误日志 (详细错误信息和堆栈跟踪)
   - 应用状态日志 (启动、关闭等系统事件)
   - 数据库操作日志 (连接错误等)

5. **日志查看**:
   ```bash
   # 查看最新日志
   cat /var/log/wenzhi-server.log
   
   # 实时查看日志更新
   tail -f /var/log/wenzhi-server.log
   
   # 查看错误日志
   cat /var/log/wenzhi-server-error-$(date +%Y-%m-%d).log
   ```

6. **日志轮转**:
   - 按天自动轮转
   - 单个日志文件最大20MB
   - 保留最近14天的日志
   - 旧日志自动压缩归档 